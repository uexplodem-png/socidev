import express from 'express';
import { Op } from 'sequelize';
import { ApiKey, ApiLog, User, sequelize } from '../../models/index.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { logAudit } from '../../utils/logging.js';

const router = express.Router();

/**
 * @swagger
 * /api/admin/api-keys:
 *   get:
 *     summary: Get all API keys (admin)
 *     tags: [Admin API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *       - in: query
 *         name: limit
 *       - in: query
 *         name: status
 *       - in: query
 *         name: search
 *     responses:
 *       200:
 *         description: API keys list
 */
router.get(
  '/',
  authenticateToken,
  requirePermission('api.view'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }

    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: apiKeys } = await ApiKey.findAndCountAll({
      where,
      attributes: ['id', 'apiKey', 'status', 'lastUsedAt', 'totalRequests', 'rateLimit', 'allowedIps', 'createdAt', 'updatedAt'],
      include: [
        {
          model: User,
          as: 'user',
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      apiKeys,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/api-keys/stats:
 *   get:
 *     summary: Get API keys statistics
 *     tags: [Admin API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API keys stats
 */
router.get(
  '/stats',
  authenticateToken,
  requirePermission('api.view'),
  asyncHandler(async (req, res) => {
    const [total, active, suspended, revoked] = await Promise.all([
      ApiKey.count(),
      ApiKey.count({ where: { status: 'active' } }),
      ApiKey.count({ where: { status: 'suspended' } }),
      ApiKey.count({ where: { status: 'revoked' } }),
    ]);

    const totalRequestsResult = await ApiKey.findOne({
      attributes: [[sequelize.fn('SUM', sequelize.col('total_requests')), 'total']],
      raw: true,
    });
    const totalRequests = parseInt(totalRequestsResult?.total) || 0;

    const recentLogs = await ApiLog.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    res.json({
      stats: {
        total,
        active,
        suspended,
        revoked,
        totalRequests,
        requestsLast24h: recentLogs,
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/api-keys/:id:
 *   get:
 *     summary: Get specific API key details
 *     tags: [Admin API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API key details
 */
router.get(
  '/:id',
  authenticateToken,
  requirePermission('api.view'),
  asyncHandler(async (req, res) => {
    const apiKey = await ApiKey.findByPk(req.params.id, {
      attributes: ['id', 'apiKey', 'status', 'lastUsedAt', 'totalRequests', 'rateLimit', 'allowedIps', 'metadata', 'createdAt', 'updatedAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatar', 'role'],
        },
      ],
    });

    if (!apiKey) {
      return res.status(404).json({
        error: 'API key not found',
        code: 'API_KEY_NOT_FOUND',
      });
    }

    res.json({ apiKey });
  })
);

/**
 * @swagger
 * /api/admin/api-keys/:id/status:
 *   put:
 *     summary: Update API key status (suspend/activate/revoke)
 *     tags: [Admin API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, suspended, revoked]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.put(
  '/:id/status',
  authenticateToken,
  requirePermission('api.edit'),
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!['active', 'suspended', 'revoked'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be: active, suspended, or revoked',
        code: 'INVALID_STATUS',
      });
    }

    const apiKey = await ApiKey.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    });

    if (!apiKey) {
      return res.status(404).json({
        error: 'API key not found',
        code: 'API_KEY_NOT_FOUND',
      });
    }

    const oldStatus = apiKey.status;
    await apiKey.update({ status });

    // Log audit
    await logAudit(req, {
      action: 'api_key_status_changed',
      resource: 'api_key',
      resourceId: apiKey.id,
      targetUserId: apiKey.userId,
      targetUserName: `${apiKey.user.firstName} ${apiKey.user.lastName}`,
      description: `Changed API key status from ${oldStatus} to ${status}`,
      metadata: { oldStatus, newStatus: status, apiKey: apiKey.apiKey },
    });

    res.json({
      message: 'API key status updated successfully',
      apiKey: {
        id: apiKey.id,
        apiKey: apiKey.apiKey,
        status: apiKey.status,
        updatedAt: apiKey.updatedAt,
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/api-keys/:id:
 *   delete:
 *     summary: Delete API key permanently
 *     tags: [Admin API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API key deleted successfully
 */
router.delete(
  '/:id',
  authenticateToken,
  requirePermission('api.delete'),
  asyncHandler(async (req, res) => {
    const apiKey = await ApiKey.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    });

    if (!apiKey) {
      return res.status(404).json({
        error: 'API key not found',
        code: 'API_KEY_NOT_FOUND',
      });
    }

    // Log audit before deletion
    await logAudit(req, {
      action: 'api_key_deleted',
      resource: 'api_key',
      resourceId: apiKey.id,
      targetUserId: apiKey.userId,
      targetUserName: `${apiKey.user.firstName} ${apiKey.user.lastName}`,
      description: `Deleted API key`,
      metadata: { apiKey: apiKey.apiKey },
    });

    await apiKey.destroy();

    res.json({
      message: 'API key deleted successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/api-keys/user/:userId:
 *   get:
 *     summary: Get API key for specific user (for Users Detail page)
 *     tags: [Admin API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's API key
 *       404:
 *         description: User has no API key
 */
router.get(
  '/user/:userId',
  authenticateToken,
  requirePermission('api.view'),
  asyncHandler(async (req, res) => {
    const apiKey = await ApiKey.findOne({
      where: { userId: req.params.userId },
      attributes: ['id', 'apiKey', 'status', 'lastUsedAt', 'totalRequests', 'rateLimit', 'allowedIps', 'metadata', 'createdAt', 'updatedAt'],
    });

    if (!apiKey) {
      return res.status(404).json({
        error: 'User has no API key',
        code: 'API_KEY_NOT_FOUND',
      });
    }

    res.json({ apiKey });
  })
);

/**
 * @swagger
 * /api/admin/api-keys/user/:userId/logs:
 *   get:
 *     summary: Get API logs for specific user (for Users Detail page)
 *     tags: [Admin API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *       - in: query
 *         name: limit
 *       - in: query
 *         name: endpoint
 *       - in: query
 *         name: method
 *       - in: query
 *         name: status
 *     responses:
 *       200:
 *         description: User's API logs
 */
router.get(
  '/user/:userId/logs',
  authenticateToken,
  requirePermission('api.view'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, endpoint, method, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.params.userId };

    if (endpoint) {
      where.endpoint = { [Op.like]: `%${endpoint}%` };
    }
    if (method) {
      where.method = method;
    }
    if (status) {
      where.statusCode = parseInt(status);
    }

    const { count, rows: logs } = await ApiLog.findAndCountAll({
      where,
      attributes: ['id', 'endpoint', 'method', 'statusCode', 'ipAddress', 'userAgent', 'responseTime', 'errorMessage', 'createdAt'],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/api-logs/:id:
 *   get:
 *     summary: Get detailed API log (with request/response bodies)
 *     tags: [Admin API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detailed API log
 */
router.get(
  '/logs/:id',
  authenticateToken,
  requirePermission('api.view'),
  asyncHandler(async (req, res) => {
    const log = await ApiLog.findByPk(req.params.id, {
      attributes: ['id', 'endpoint', 'method', 'statusCode', 'ipAddress', 'userAgent', 'requestBody', 'responseBody', 'responseTime', 'errorMessage', 'metadata', 'createdAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: ApiKey,
          as: 'apiKey',
          attributes: ['id', 'apiKey', 'status'],
        },
      ],
    });

    if (!log) {
      return res.status(404).json({
        error: 'API log not found',
        code: 'API_LOG_NOT_FOUND',
      });
    }

    res.json({ log });
  })
);

export default router;
