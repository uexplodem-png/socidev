import { AuditLog, ActivityLog } from '../models/index.js';
import logger from '../config/logger.js';
import EventEmitter from 'events';

/**
 * Event emitter for async logging operations
 * Allows logging to happen without blocking the main request/response cycle
 */
export const loggingEmitter = new EventEmitter();

// Set max listeners to avoid memory leaks
loggingEmitter.setMaxListeners(20);

/**
 * Log an audit action (admin/system actions)
 * @param {Object} logData - The audit log data
 * @param {string} logData.actorId - ID of the user performing the action
 * @param {string} logData.action - The action type (e.g., 'USER_CREATED', 'USER_UPDATED')
 * @param {string} logData.resource - Resource type (e.g., 'user', 'transaction')
 * @param {string} logData.resourceId - ID of the affected resource
 * @param {string} [logData.targetUserId] - ID of the targeted user (if applicable)
 * @param {string} [logData.description] - Human-readable description
 * @param {Object} [logData.metadata] - Additional metadata about the action
 * @param {string} [logData.ipAddress] - IP address of the requester
 * @param {string} [logData.userAgent] - User agent string
 * @returns {Promise<Object>} The created audit log entry
 */
export async function logAuditAction(logData) {
  try {
    const {
      actorId,
      action,
      resource,
      resourceId,
      targetUserId = null,
      description = '',
      metadata = {},
      ipAddress = null,
      userAgent = null,
    } = logData;

    // Validate required fields
    if (!actorId || !action || !resource || !resourceId) {
      logger.warn('Missing required audit log fields', {
        actorId: !!actorId,
        action: !!action,
        resource: !!resource,
        resourceId: !!resourceId,
      });
      return null;
    }

    // Get actor user details
    const { User } = await import('../models/index.js');
    const actor = await User.findByPk(actorId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
    });

    if (!actor) {
      logger.warn('Actor user not found for audit log', { actorId });
      return null;
    }

    // Get target user details if applicable
    let targetUser = null;
    if (targetUserId) {
      targetUser = await User.findByPk(targetUserId, {
        attributes: ['id', 'firstName', 'lastName', 'email'],
      });
    }

    const auditLogEntry = await AuditLog.create({
      actor_id: actorId,
      actor_name: `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || 'Unknown',
      actor_email: actor.email,
      action,
      resource,
      resource_id: resourceId,
      target_user_id: targetUserId,
      target_user_name: targetUser
        ? `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim()
        : null,
      description: description || `${action.replace(/_/g, ' ')} on ${resource}`,
      metadata: metadata || {},
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    logger.debug('Audit log created', {
      logId: auditLogEntry.id,
      action,
      resource,
      actor: actor.email,
    });

    return auditLogEntry;
  } catch (error) {
    logger.error('Failed to create audit log', {
      error: error.message,
      logData,
    });
    return null;
  }
}

/**
 * Log user activity
 * @param {Object} logData - The activity log data
 * @param {string} logData.userId - ID of the user performing the activity
 * @param {string} logData.type - Activity type (e.g., 'LOGIN', 'PROFILE_UPDATE', 'ORDER_CREATED')
 * @param {string} logData.action - Specific action description
 * @param {Object} [logData.details] - Additional details about the activity
 * @param {string} [logData.ipAddress] - IP address of the user
 * @param {string} [logData.userAgent] - User agent string
 * @returns {Promise<Object>} The created activity log entry
 */
export async function logUserActivity(logData) {
  try {
    const {
      userId,
      type,
      action,
      details = {},
      ipAddress = null,
      userAgent = null,
    } = logData;

    // Validate required fields
    if (!userId || !type || !action) {
      logger.warn('Missing required activity log fields', {
        userId: !!userId,
        type: !!type,
        action: !!action,
      });
      return null;
    }

    const activityLogEntry = await ActivityLog.create({
      userId,
      type,
      action,
      details: details || {},
      ipAddress,
      userAgent,
    });

    logger.debug('Activity log created', {
      logId: activityLogEntry.id,
      userId,
      type,
      action,
    });

    return activityLogEntry;
  } catch (error) {
    logger.error('Failed to create activity log', {
      error: error.message,
      logData,
    });
    return null;
  }
}

/**
 * Log an async operation (non-blocking)
 * Emits an event to log without blocking the response
 * @param {string} logType - Type of log ('audit' or 'activity')
 * @param {Object} logData - Log data to process
 * @param {Function} callback - Optional callback after logging
 */
export function logAsync(logType, logData, callback = null) {
  loggingEmitter.emit(`log:${logType}`, logData, callback);
}

/**
 * Get detailed change data for CRUD operations
 * Compares before and after states
 * @param {Object} before - Original data
 * @param {Object} after - Updated data
 * @param {Array<string>} [excludeFields] - Fields to exclude from comparison
 * @returns {Object} Object with changes, including added, modified, and removed fields
 */
export function getChangeDetails(before, after, excludeFields = ['password', 'refreshToken']) {
  const changes = {
    added: {},
    modified: {},
    removed: {},
  };

  if (!before) {
    // New record - all fields are added
    Object.keys(after).forEach((key) => {
      if (!excludeFields.includes(key)) {
        changes.added[key] = after[key];
      }
    });
    return changes;
  }

  // Check for modified and removed fields
  Object.keys(before).forEach((key) => {
    if (excludeFields.includes(key)) return;

    if (!(key in after)) {
      changes.removed[key] = before[key];
    } else if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes.modified[key] = {
        old: before[key],
        new: after[key],
      };
    }
  });

  // Check for added fields
  Object.keys(after).forEach((key) => {
    if (excludeFields.includes(key)) return;

    if (!(key in before)) {
      changes.added[key] = after[key];
    }
  });

  return changes;
}

/**
 * Format resource identifier for logging
 * @param {string} resourceType - Type of resource
 * @param {string} resourceId - ID of the resource
 * @returns {string} Formatted resource identifier
 */
export function formatResourceId(resourceType, resourceId) {
  return `${resourceType}:${resourceId}`;
}

/**
 * Parse CRUD operation from HTTP method
 * @param {string} method - HTTP method
 * @param {Object} context - Request context
 * @returns {string} CRUD operation type
 */
export function parseCRUDOperation(method, context = {}) {
  const methodMap = {
    POST: 'CREATE',
    GET: 'READ',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
  };

  return methodMap[method] || 'UNKNOWN';
}

/**
 * Get safe request body (removes sensitive data)
 * @param {Object} body - Request body
 * @returns {Object} Sanitized request body
 */
export function getSafeRequestBody(body) {
  const sensitiveFields = [
    'password',
    'refreshToken',
    'token',
    'apiKey',
    'secret',
    'creditCard',
    'ssn',
  ];

  const safe = JSON.parse(JSON.stringify(body || {}));

  function sanitize(obj) {
    for (const key in obj) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  }

  sanitize(safe);
  return safe;
}

/**
 * Extract meaningful endpoint path for logging
 * @param {string} url - Request URL
 * @returns {string} Cleaned endpoint path
 */
export function extractEndpointPath(url) {
  // Remove query strings and fragments
  return url.split('?')[0].split('#')[0];
}

/**
 * Setup async event handlers for logging
 * Should be called during server initialization
 */
export function setupAsyncLoggingHandlers() {
  // Handle async audit logging
  loggingEmitter.on('log:audit', async (logData, callback) => {
    try {
      await logAuditAction(logData);
      if (callback) callback(null);
    } catch (error) {
      logger.error('Async audit logging failed', { error: error.message });
      if (callback) callback(error);
    }
  });

  // Handle async activity logging
  loggingEmitter.on('log:activity', async (logData, callback) => {
    try {
      await logUserActivity(logData);
      if (callback) callback(null);
    } catch (error) {
      logger.error('Async activity logging failed', { error: error.message });
      if (callback) callback(error);
    }
  });

  logger.info('✅ Async logging handlers initialized');
}

export default {
  logAuditAction,
  logUserActivity,
  logAsync,
  getChangeDetails,
  formatResourceId,
  parseCRUDOperation,
  getSafeRequestBody,
  extractEndpointPath,
  setupAsyncLoggingHandlers,
  loggingEmitter,
};
