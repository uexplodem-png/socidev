/**
 * Admin Logs Controller
 * 
 * Handles audit logs and action logs viewing with pagination and filters.
 */

import { AuditLog, ActivityLog, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../config/logger.js';
import { Op } from 'sequelize';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logAudit } from '../utils/logging.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AdminLogsController {
  /**
   * GET /admin/audit-logs
   * Get audit logs with pagination and filters
   */
  async getAuditLogs(req, res, next) {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        resource,
        actorId,
        targetUserId,
        startDate,
        endDate,
        search
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const where = {};

      // Filters
      if (action) {
        where.action = action;
      }

      if (resource) {
        where.resource = resource;
      }

      if (actorId) {
        where.actor_id = actorId;
      }

      if (targetUserId) {
        where.target_user_id = targetUserId;
      }

      // Date range filter
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) {
          where.created_at[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          where.created_at[Op.lte] = new Date(endDate);
        }
      }

      // Search in description or actor name
      if (search) {
        where[Op.or] = [
          { description: { [Op.like]: `%${search}%` } },
          { actor_name: { [Op.like]: `%${search}%` } },
          { actor_email: { [Op.like]: `%${search}%` } },
          { target_user_name: { [Op.like]: `%${search}%` } }
        ];
      }

      // Fetch logs with pagination
      const { rows: logs, count: total } = await AuditLog.findAndCountAll({
        where,
        attributes: [
          'id',
          'actor_id',
          'actor_name',
          'actor_email',
          'action',
          'resource',
          'resource_id',
          'target_user_id',
          'target_user_name',
          'description',
          'metadata',
          'ip_address',
          'user_agent',
          'created_at'
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset,
        raw: true
      });

      // Parse metadata JSON
      const logsWithParsedMetadata = logs.map(log => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : null
      }));

      logger.info('Audit logs fetched', {
        userId: req.user.id,
        page,
        limit,
        total,
        filters: { action, resource, actorId, targetUserId, startDate, endDate, search }
      });

      res.json({
        success: true,
        data: {
          logs: logsWithParsedMetadata,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      next(error);
    }
  }

  /**
   * GET /admin/action-logs
   * Get action logs (user activity timeline) with pagination and filters
   */
  async getActionLogs(req, res, next) {
    try {
      const {
        page = 1,
        limit = 50,
        userId,
        type,
        action,
        startDate,
        endDate,
        search
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const where = {};
      const include = [];

      // Filters
      if (userId) {
        where.user_id = userId;
      }

      if (type) {
        where.type = type;
      }

      if (action) {
        where.action = action;
      }

      // Date range filter
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) {
          where.created_at[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          where.created_at[Op.lte] = new Date(endDate);
        }
      }

      // Search in details
      if (search) {
        where.details = { [Op.like]: `%${search}%` };
      }

      // Include user info
      include.push({
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'username'],
        required: false
      });

      // Fetch logs with pagination
      const { rows: logs, count: total } = await ActivityLog.findAndCountAll({
        where,
        attributes: [
          'id',
          'user_id',
          'type',
          'action',
          'details',
          'ip_address',
          'user_agent',
          'created_at'
        ],
        include,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      // Parse details JSON if needed
      const logsWithParsedDetails = logs.map(log => {
        const logData = log.toJSON();
        if (typeof logData.details === 'string') {
          try {
            logData.details = JSON.parse(logData.details);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }
        return logData;
      });

      logger.info('Action logs fetched', {
        userId: req.user.id,
        page,
        limit,
        total,
        filters: { userId, type, action, startDate, endDate, search }
      });

      res.json({
        success: true,
        data: {
          logs: logsWithParsedDetails,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching action logs:', error);
      next(error);
    }
  }

  /**
   * GET /admin/audit-logs/actions
   * Get list of unique actions for filtering
   */
  async getAuditActions(req, res, next) {
    try {
      const actions = await AuditLog.findAll({
        attributes: ['action'],
        group: ['action'],
        raw: true
      });

      res.json({
        success: true,
        data: actions.map(a => a.action)
      });
    } catch (error) {
      logger.error('Error fetching audit actions:', error);
      next(error);
    }
  }

  /**
   * GET /admin/audit-logs/resources
   * Get list of unique resources for filtering
   */
  async getAuditResources(req, res, next) {
    try {
      const resources = await AuditLog.findAll({
        attributes: ['resource'],
        group: ['resource'],
        raw: true
      });

      res.json({
        success: true,
        data: resources.map(r => r.resource)
      });
    } catch (error) {
      logger.error('Error fetching audit resources:', error);
      next(error);
    }
  }

  /**
   * GET /admin/action-logs/types
   * Get list of unique types for filtering
   */
  async getActionTypes(req, res, next) {
    try {
      const types = await ActivityLog.findAll({
        attributes: ['type'],
        group: ['type'],
        raw: true
      });

      res.json({
        success: true,
        data: types.map(t => t.type)
      });
    } catch (error) {
      logger.error('Error fetching action types:', error);
      next(error);
    }
  }

  /**
   * GET /admin/action-logs/actions
   * Get list of unique actions for filtering
   */
  async getActionActions(req, res, next) {
    try {
      const actions = await ActivityLog.findAll({
        attributes: ['action'],
        group: ['action'],
        raw: true
      });

      res.json({
        success: true,
        data: actions.map(a => a.action)
      });
    } catch (error) {
      logger.error('Error fetching action actions:', error);
      next(error);
    }
  }

  /**
   * GET /admin/system-logs/combined
   * Get combined system logs from combined.log file
   */
  async getCombinedLogs(req, res, next) {
    try {
      const { page = 1, limit = 100, search = '' } = req.query;
      const logPath = path.join(__dirname, '../../../logs/combined.log');

      // Check if file exists
      try {
        await fs.access(logPath);
      } catch {
        return res.json({
          success: true,
          data: {
            logs: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              pages: 0
            }
          }
        });
      }

      // Read log file
      const logContent = await fs.readFile(logPath, 'utf-8');
      const lines = logContent.split('\n').filter(line => line.trim());

      // Parse JSON logs
      let parsedLogs = [];
      for (const line of lines) {
        try {
          const log = JSON.parse(line);
          parsedLogs.push(log);
        } catch {
          // Skip invalid JSON lines
        }
      }

      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase();
        parsedLogs = parsedLogs.filter(log =>
          JSON.stringify(log).toLowerCase().includes(searchLower)
        );
      }

      // Sort by timestamp (newest first)
      parsedLogs.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });

      // Paginate
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedLogs = parsedLogs.slice(startIndex, endIndex);

      // Log audit trail
      await logAudit({
        actorId: req.user.id,
        actorName: `${req.user.firstName} ${req.user.lastName}`,
        actorEmail: req.user.email,
        action: 'SYSTEM_LOGS_VIEWED',
        resource: 'system_logs',
        resourceId: 'combined',
        description: 'Viewed combined system logs',
        metadata: { page, limit, search },
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent')
      });

      logger.info('Combined system logs fetched', {
        userId: req.user.id,
        page,
        limit,
        total: parsedLogs.length
      });

      res.json({
        success: true,
        data: {
          logs: paginatedLogs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parsedLogs.length,
            pages: Math.ceil(parsedLogs.length / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching combined logs:', error);
      next(error);
    }
  }

  /**
   * GET /admin/system-logs/error
   * Get error system logs from error.log file
   */
  async getErrorLogs(req, res, next) {
    try {
      const { page = 1, limit = 100, search = '' } = req.query;
      const logPath = path.join(__dirname, '../../../logs/error.log');

      // Check if file exists
      try {
        await fs.access(logPath);
      } catch {
        return res.json({
          success: true,
          data: {
            logs: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              pages: 0
            }
          }
        });
      }

      // Read log file
      const logContent = await fs.readFile(logPath, 'utf-8');
      const lines = logContent.split('\n').filter(line => line.trim());

      // Parse JSON logs
      let parsedLogs = [];
      for (const line of lines) {
        try {
          const log = JSON.parse(line);
          parsedLogs.push(log);
        } catch {
          // Skip invalid JSON lines
        }
      }

      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase();
        parsedLogs = parsedLogs.filter(log =>
          JSON.stringify(log).toLowerCase().includes(searchLower)
        );
      }

      // Sort by timestamp (newest first)
      parsedLogs.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });

      // Paginate
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedLogs = parsedLogs.slice(startIndex, endIndex);

      // Log audit trail
      await logAudit({
        actorId: req.user.id,
        actorName: `${req.user.firstName} ${req.user.lastName}`,
        actorEmail: req.user.email,
        action: 'SYSTEM_LOGS_VIEWED',
        resource: 'system_logs',
        resourceId: 'error',
        description: 'Viewed error system logs',
        metadata: { page, limit, search },
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent')
      });

      logger.info('Error system logs fetched', {
        userId: req.user.id,
        page,
        limit,
        total: parsedLogs.length
      });

      res.json({
        success: true,
        data: {
          logs: paginatedLogs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parsedLogs.length,
            pages: Math.ceil(parsedLogs.length / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching error logs:', error);
      next(error);
    }
  }

  /**
   * DELETE /admin/system-logs/clear/:type
   * Clear system log files (admin only)
   */
  async clearSystemLogs(req, res, next) {
    try {
      const { type } = req.params;
      
      if (!['combined', 'error'].includes(type)) {
        throw new ApiError(400, 'Invalid log type. Must be "combined" or "error"');
      }

      const logPath = path.join(__dirname, `../../../logs/${type}.log`);

      // Clear log file
      await fs.writeFile(logPath, '');

      // Log audit trail
      await logAudit({
        actorId: req.user.id,
        actorName: `${req.user.firstName} ${req.user.lastName}`,
        actorEmail: req.user.email,
        action: 'SYSTEM_LOGS_CLEARED',
        resource: 'system_logs',
        resourceId: type,
        description: `Cleared ${type} system logs`,
        metadata: { logType: type },
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent')
      });

      logger.warn(`${type} system logs cleared by admin`, {
        userId: req.user.id,
        userName: `${req.user.firstName} ${req.user.lastName}`
      });

      res.json({
        success: true,
        message: `${type} logs cleared successfully`
      });
    } catch (error) {
      logger.error('Error clearing system logs:', error);
      next(error);
    }
  }
}

export const adminLogsController = new AdminLogsController();
