/**
 * Admin Logs Controller
 * 
 * Handles audit logs and action logs viewing with pagination and filters.
 */

import { AuditLog, ActivityLog, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../config/logger.js';
import { Op } from 'sequelize';

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
}

export const adminLogsController = new AdminLogsController();
