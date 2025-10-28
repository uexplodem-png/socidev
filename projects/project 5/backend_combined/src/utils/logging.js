import { AuditLog, ActivityLog } from '../models/index.js';
import { logger } from '../utils/logger.js';

/**
 * Log an audit entry (system-wide admin/user actions)
 * @param {Object} req - Express request object
 * @param {Object} options - Logging options
 * @param {string} options.action - Action performed
 * @param {string} options.resource - Resource type
 * @param {string} options.resourceId - Resource ID
 * @param {string} [options.targetUserId] - Target user ID (if applicable)
 * @param {string} [options.targetUserName] - Target user name
 * @param {string} [options.description] - Description of action
 * @param {Object} [options.metadata] - Additional metadata
 * @returns {Promise<Object>} Created audit log entry
 */
export async function logAudit(req, options) {
  try {
    const {
      action,
      resource,
      resourceId,
      targetUserId = null,
      targetUserName = null,
      description = null,
      metadata = null
    } = options;

    // Extract actor info from request
    const actor = req.user || {};
    const actorId = actor.id || null;
    const actorName = actor.username || actor.email || 'System';
    const actorEmail = actor.email || null;

    // Extract IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    // Create audit log entry
    const auditLog = await AuditLog.create({
      actor_id: actorId,
      actor_name: actorName,
      actor_email: actorEmail,
      action,
      resource,
      resource_id: resourceId,
      target_user_id: targetUserId,
      target_user_name: targetUserName,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    logger.info('Audit log created', {
      action,
      resource,
      resourceId,
      actorId,
      targetUserId
    });

    return auditLog;
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    // Don't throw - logging failures shouldn't break the application
    return null;
  }
}

/**
 * Log an action entry (user activity timeline)
 * @param {Object} req - Express request object
 * @param {Object} options - Logging options
 * @param {string} options.userId - User ID
 * @param {string} options.type - Action type/category
 * @param {string} options.action - Action performed
 * @param {string} [options.details] - Action details
 * @returns {Promise<Object>} Created action log entry
 */
export async function logAction(req, options) {
  try {
    const {
      userId,
      type,
      action,
      details = null
    } = options;

    // Extract IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    // Create action log entry
    const actionLog = await ActivityLog.create({
      user_id: userId,
      type,
      action,
      details,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    logger.info('Action log created', {
      userId,
      type,
      action
    });

    return actionLog;
  } catch (error) {
    logger.error('Failed to create action log:', error);
    // Don't throw - logging failures shouldn't break the application
    return null;
  }
}

/**
 * Combined logging for actions that affect users
 * @param {Object} req - Express request object
 * @param {Object} auditOptions - Audit log options
 * @param {Object} actionOptions - Action log options
 * @returns {Promise<Object>} Both log entries
 */
export async function logAuditAndAction(req, auditOptions, actionOptions) {
  const [auditLog, actionLog] = await Promise.all([
    logAudit(req, auditOptions),
    logAction(req, actionOptions)
  ]);

  return { auditLog, actionLog };
}

export default {
  logAudit,
  logAction,
  logAuditAndAction
};
