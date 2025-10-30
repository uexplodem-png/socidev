import express from 'express';
import { Op } from 'sequelize';
import { AuditLog, User } from '../../models/index.js';
import { validate } from '../../middleware/validation.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import { logAudit } from '../../utils/logging.js';
import Joi from 'joi';
import { sequelize } from '../../config/database.js';

const router = express.Router();

/**
 * @swagger
 * /api/admin/audit-logs/stats:
 *   get:
 *     summary: Get audit log statistics
 *     tags: [Admin Audit Logs]
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
 *         description: Audit log statistics
 */
router.get('/stats',
  requirePermission('audit.view'),
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

    // Get audit log statistics
    const [
      totalLogs,
      userActions,
      orderActions,
      taskActions,
      systemActions,
    ] = await Promise.all([
      AuditLog.count({ where: dateFilter }),
      AuditLog.count({ where: { ...dateFilter, resource: 'user' } }),
      AuditLog.count({ where: { ...dateFilter, resource: 'order' } }),
      AuditLog.count({ where: { ...dateFilter, resource: 'task' } }),
      AuditLog.count({ where: { ...dateFilter, resource: 'system' } }),
    ]);

    // Get action breakdown
    const actionBreakdown = await AuditLog.findAll({
      where: dateFilter,
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['action'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true,
    });

    // Get most active admins
    const activeAdmins = await AuditLog.findAll({
      where: dateFilter,
      attributes: [
        'actor_id',
        'actor_name',
        'actor_email',
        [sequelize.fn('COUNT', sequelize.col('id')), 'action_count'],
      ],
      group: ['actor_id', 'actor_name', 'actor_email'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 5,
      raw: true,
    });

    res.json({
      summary: {
        totalLogs,
        userActions,
        orderActions,
        taskActions,
        systemActions,
      },
      actionBreakdown,
      activeAdmins,
      period: timeRange,
    });
  })
);

/**
 * @swagger
 * /api/admin/audit-logs/export:
 *   get:
 *     summary: Export audit logs to CSV
 *     tags: [Admin Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV file with audit logs
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/export',
  requirePermission('audit.view'),
  validate(Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    action: Joi.string().max(100).optional(),
    resource: Joi.string().max(50).optional(),
  }), 'query'),
  asyncHandler(async (req, res) => {
    const { startDate, endDate, action, resource } = req.query;

    // Build where clause
    const where = {};

    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    if (action) {
      where.action = action;
    }

    if (resource) {
      where.resource = resource;
    }

    // Fetch all matching audit logs
    const auditLogs = await AuditLog.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: 10000, // Limit export to prevent memory issues
    });

    // Generate CSV content
    const csvHeaders = [
      'Timestamp',
      'Actor Name',
      'Actor Email',
      'Action',
      'Resource',
      'Resource ID',
      'Target User',
      'Description',
      'IP Address',
    ];

    const csvRows = auditLogs.map(log => [
      log.created_at.toISOString(),
      log.actor_name,
      log.actor_email,
      log.action,
      log.resource,
      log.resource_id,
      log.target_user_name || '',
      log.description,
      log.ip_address || '',
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Set response headers for file download
    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Log the export
    await logAudit(req, {
      action: 'AUDIT_LOGS_EXPORTED',
      resource: 'system',
      resourceId: 'audit_logs',
      description: `Audit logs exported - ${auditLogs.length} records`,
      metadata: {
        recordCount: auditLogs.length,
        filters: { startDate, endDate, action, resource },
      }
    });

    res.send(csvContent);
  })
);

/**
 * @swagger
 * /api/admin/audit-logs:
 *   get:
 *     summary: Get audit logs with filtering and pagination
 *     tags: [Admin Audit Logs]
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
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *       - in: query
 *         name: actor_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of audit logs with pagination
 */
router.get('/',
  requirePermission('audit.view'),
  validate(Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(255).allow('').optional(),
    action: Joi.string().max(100).allow('').optional(),
    resource: Joi.string().max(50).allow('').optional(),
    actor_id: Joi.string().uuid().allow('').optional(),
    target_user_id: Joi.string().uuid().allow('').optional(),
    user_id: Joi.string().uuid().allow('').optional(),
    sortBy: Joi.string().valid('created_at', 'action', 'resource').default('created_at'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }), 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, search, action, resource, actor_id, target_user_id, user_id, sortBy, sortOrder } = req.query;

    // Build where clause
    const where = {};

    if (search && search.trim()) {
      where[Op.or] = [
        { actor_name: { [Op.like]: `%${search}%` } },
        { actor_email: { [Op.like]: `%${search}%` } },
        { target_user_name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (action && action.trim()) {
      where.action = action;
    }

    if (resource && resource.trim()) {
      where.resource = resource;
    }

    if (actor_id && actor_id.trim()) {
      where.actor_id = actor_id;
    }

    if (target_user_id && target_user_id.trim()) {
      where.target_user_id = target_user_id;
    }

    // If user_id is provided, get logs where user is either actor OR target
    if (user_id && user_id.trim()) {
      where[Op.or] = [
        { actor_id: user_id },
        { target_user_id: user_id },
      ];
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch audit logs with pagination
    const { count, rows: auditLogs } = await AuditLog.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role'],
        },
        {
          model: User,
          as: 'targetUser',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false,
        },
      ],
    });

    res.json({
      auditLogs,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  })
);

export default router;