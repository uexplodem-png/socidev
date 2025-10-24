import {
  logAuditAction,
  logUserActivity,
  logAsync,
  getChangeDetails,
  parseCRUDOperation,
  getSafeRequestBody,
  extractEndpointPath,
} from '../utils/logHelper.js';
import logger from '../config/logger.js';

/**
 * CRUD Logging Middleware
 * Automatically logs all CREATE, READ, UPDATE, DELETE operations
 * 
 * Features:
 * - Tracks all CRUD operations with detailed metadata
 * - Separate logging for admin actions (audit_logs) and user activities (activity_logs)
 * - Async logging to avoid blocking responses
 * - Sanitizes sensitive data
 * - Captures request/response details, IP addresses, user agents
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.syncMode - If true, logs synchronously; if false, logs asynchronously
 * @param {Array<string>} options.excludeEndpoints - Endpoints to exclude from logging
 * @param {Array<string>} options.excludeFields - Fields to exclude from change tracking
 * @param {boolean} options.logRequestBody - If true, includes request body in logs
 * @param {boolean} options.logResponseBody - If true, includes response body in logs
 * @returns {Function} Express middleware function
 */
export function crudLoggingMiddleware(options = {}) {
  const {
    syncMode = false,
    excludeEndpoints = ['/health', '/status', '/metrics'],
    excludeFields = ['password', 'refreshToken', 'token', 'apiKey'],
    logRequestBody = true,
    logResponseBody = false,
  } = options;

  return async (req, res, next) => {
    try {
      // Skip logging for excluded endpoints
      if (excludeEndpoints.some((endpoint) => req.path.startsWith(endpoint))) {
        return next();
      }

      // Store original response methods
      const originalJson = res.json;
      const originalSend = res.send;

      // Store request metadata
      const requestMetadata = {
        method: req.method,
        endpoint: extractEndpointPath(req.path),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString(),
        userId: req.user?.id,
        userRole: req.user?.role,
        requestBody: logRequestBody ? getSafeRequestBody(req.body) : {},
      };

      // Store response data
      let responseData = null;
      let responseStatus = null;

      // Override res.json to capture response
      res.json = function (data) {
        responseData = data;
        responseStatus = res.statusCode;
        return originalJson.call(this, data);
      };

      // Override res.send to capture response
      res.send = function (data) {
        try {
          responseData = typeof data === 'string' ? data : data;
          responseStatus = res.statusCode;
        } catch (e) {
          // Ignore parsing errors
        }
        return originalSend.call(this, data);
      };

      // Call next middleware
      await next();

      // Only log after response is sent (use setTimeout to ensure it's after res.json/send)
      setImmediate(() => {
        logCRUDOperation({
          req,
          res,
          requestMetadata,
          responseData,
          responseStatus,
          excludeFields,
          syncMode,
        });
      });
    } catch (error) {
      logger.error('Error in CRUD logging middleware', {
        error: error.message,
        path: req.path,
      });
      next();
    }
  };
}

/**
 * Helper function to determine log type (audit vs activity) and log accordingly
 */
async function logCRUDOperation({
  req,
  res,
  requestMetadata,
  responseData,
  responseStatus,
  excludeFields,
  syncMode,
}) {
  try {
    const { method, endpoint, userId, userRole, ip, userAgent, timestamp } = requestMetadata;
    const operation = parseCRUDOperation(method);

    // Skip logging for errors or unsuccessful operations
    if (!responseStatus || responseStatus >= 400) {
      logger.debug('Skipping log for failed operation', {
        endpoint,
        status: responseStatus,
        operation,
      });
      return;
    }

    // Determine if this is an admin action or user activity
    const isAdminAction = userRole === 'admin' || endpoint.includes('/admin');

    // Extract resource type and ID from the endpoint
    const { resourceType, resourceId } = extractResourceInfo(endpoint, responseData);

    if (isAdminAction) {
      // Log to audit_logs for admin actions
      const auditLogData = {
        actorId: userId,
        action: `${operation}_${resourceType?.toUpperCase() || 'RESOURCE'}`,
        resource: resourceType || 'unknown',
        resourceId: resourceId || 'N/A',
        targetUserId: req.body?.userId || req.params?.userId,
        description: `Admin performed ${operation} on ${resourceType}: ${endpoint}`,
        metadata: {
          endpoint,
          method,
          operation,
          statusCode: responseStatus,
          requestBody: getSafeRequestBody(req.body),
          requestParams: req.params,
          requestQuery: req.query,
          timestamp,
        },
        ipAddress: ip,
        userAgent,
      };

      if (syncMode) {
        await logAuditAction(auditLogData);
      } else {
        logAsync('audit', auditLogData);
      }
    } else if (userId) {
      // Log to activity_logs for user activities
      const activityLogData = {
        userId,
        type: resourceType?.toUpperCase() || 'GENERAL',
        action: `${operation}: ${endpoint}`,
        details: {
          endpoint,
          method,
          operation,
          statusCode: responseStatus,
          requestBody: getSafeRequestBody(req.body),
          requestParams: req.params,
          requestQuery: req.query,
          resourceId,
          timestamp,
        },
        ipAddress: ip,
        userAgent,
      };

      if (syncMode) {
        await logUserActivity(activityLogData);
      } else {
        logAsync('activity', activityLogData);
      }
    }

    logger.debug('CRUD operation logged', {
      operation,
      resourceType,
      endpoint,
      status: responseStatus,
      isAdminAction,
    });
  } catch (error) {
    logger.error('Failed to log CRUD operation', {
      error: error.message,
      endpoint: req.path,
    });
  }
}

/**
 * Extract resource type and ID from endpoint and response data
 */
function extractResourceInfo(endpoint, responseData) {
  // Parse endpoint: /api/admin/users/123 -> { resource: 'users', id: '123' }
  const pathParts = endpoint.split('/').filter((part) => part);

  let resourceType = 'unknown';
  let resourceId = null;

  // Try to extract resource type from endpoint
  if (pathParts.length >= 3) {
    // Get the resource type (typically the part before the ID)
    resourceType = pathParts[pathParts.length - 2]?.replace(/s$/, '') || 'resource';

    // Try to extract ID from endpoint
    const potentialId = pathParts[pathParts.length - 1];
    if (potentialId && isValidUUID(potentialId)) {
      resourceId = potentialId;
    }
  }

  // If no ID found in endpoint, try to extract from response data
  if (!resourceId && responseData) {
    if (typeof responseData === 'object') {
      resourceId = responseData.id || responseData.data?.id;
    }
  }

  return { resourceType, resourceId };
}

/**
 * Check if string is a valid UUID
 */
function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Specific logging middleware for user actions
 * Use this for endpoints where you want to ensure user activity is logged
 */
export function logUserActivityMiddleware(options = {}) {
  const {
    activityType = 'GENERAL',
    includeSensitiveData = false,
  } = options;

  return async (req, res, next) => {
    try {
      // Store original res.json
      const originalJson = res.json;

      res.json = async function (data) {
        try {
          if (req.user && res.statusCode < 400) {
            // Log user activity
            await logUserActivity({
              userId: req.user.id,
              type: activityType,
              action: `${req.method} ${extractEndpointPath(req.path)}`,
              details: {
                endpoint: extractEndpointPath(req.path),
                method: req.method,
                statusCode: res.statusCode,
                body: includeSensitiveData ? req.body : getSafeRequestBody(req.body),
              },
              ipAddress: req.ip,
              userAgent: req.get('user-agent'),
            });
          }
        } catch (logError) {
          logger.error('Failed to log user activity', {
            error: logError.message,
          });
        }

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Error in user activity logging middleware', {
        error: error.message,
      });
      next();
    }
  };
}

/**
 * Specific logging middleware for admin audit actions
 * Use this for critical admin endpoints
 */
export function logAdminAuditMiddleware(options = {}) {
  const {
    action = 'ADMIN_ACTION',
    resource = 'unknown',
    includeRequestBody = true,
    includeResponseBody = false,
  } = options;

  return async (req, res, next) => {
    try {
      const originalJson = res.json;

      res.json = async function (data) {
        try {
          if (req.user?.role === 'admin' && res.statusCode < 400) {
            // Log admin action
            await logAuditAction({
              actorId: req.user.id,
              action,
              resource,
              resourceId: req.params.id || req.body.id || 'N/A',
              targetUserId: req.body?.userId || req.params?.userId,
              description: `${action} on ${resource}: ${extractEndpointPath(req.path)}`,
              metadata: {
                endpoint: extractEndpointPath(req.path),
                method: req.method,
                statusCode: res.statusCode,
                requestBody: includeRequestBody ? getSafeRequestBody(req.body) : {},
                responseBody: includeResponseBody ? getSafeRequestBody(data) : {},
              },
              ipAddress: req.ip,
              userAgent: req.get('user-agent'),
            });
          }
        } catch (logError) {
          logger.error('Failed to log admin audit', {
            error: logError.message,
          });
        }

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Error in admin audit logging middleware', {
        error: error.message,
      });
      next();
    }
  };
}

export default {
  crudLoggingMiddleware,
  logUserActivityMiddleware,
  logAdminAuditMiddleware,
};
