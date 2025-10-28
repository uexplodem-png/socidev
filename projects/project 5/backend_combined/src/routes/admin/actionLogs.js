import express from 'express';
import { Op } from 'sequelize';
import { ActivityLog, User } from '../../models/index.js';
import { validate } from '../../middleware/validation.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import Joi from 'joi';
import { sequelize } from '../../config/database.js';

const router = express.Router();

/**
 * @swagger
 * /api/admin/action-logs:
 *   get:
 *     summary: Get action logs with filtering and pagination
 *     tags: [Admin Action Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of action logs with pagination
 */
router.get('/',
  requirePermission('action_logs.view'),
  validate(Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(255).optional(),
    type: Joi.string().max(100).optional(),
    action: Joi.string().max(50).optional(),
    user_id: Joi.string().uuid().optional(),
    sortBy: Joi.string().valid('created_at', 'type', 'action').default('created_at'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }), 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, search, type, action, user_id, sortBy, sortOrder } = req.query;

    // Build where clause
    const where = {};

    if (search) {
      where[Op.or] = [
        { type: { [Op.like]: `%${search}%` } },
        { action: { [Op.like]: `%${search}%` } },
        { details: { [Op.like]: `%${search}%` } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (action) {
      where.action = action;
    }

    if (user_id) {
      where.user_id = user_id;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch action logs with pagination
    const { count, rows: actionLogs } = await ActivityLog.findAndCountAll({
      where,
      attributes: ['id', 'userId', 'type', 'action', 'details', 'ipAddress', 'userAgent', 'createdAt'],
      limit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          required: false,
        },
      ],
    });

    res.json({
      actionLogs,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/action-logs/stats:
 *   get:
 *     summary: Get action log statistics
 *     tags: [Admin Action Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Action log statistics
 */
router.get('/stats',
  requirePermission('action_logs.view'),
  validate(Joi.object({
    timeRange: Joi.string().valid('7d', '30d', '90d').default('30d')
  }), 'query'),
  asyncHandler(async (req, res) => {
    const { timeRange } = req.query;

    // Calculate date range
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const dateFilter = {
      created_at: {
        [Op.gte]: startDate,
      },
    };

    // Get action log statistics
    const totalLogs = await ActivityLog.count({ where: dateFilter });

    // Get action breakdown
    const actionBreakdown = await ActivityLog.findAll({
      where: dateFilter,
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['type'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true,
    });

    // Get most active users
    const activeUsers = await ActivityLog.findAll({
      where: dateFilter,
      attributes: [
        'user_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'action_count'],
      ],
      group: ['user_id'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: true,
        },
      ],
    });

    res.json({
      summary: {
        totalLogs,
      },
      actionBreakdown,
      activeUsers,
      period: timeRange,
    });
  })
);

export default router;
