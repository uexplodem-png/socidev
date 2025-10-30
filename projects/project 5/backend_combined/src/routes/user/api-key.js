import express from 'express';
import crypto from 'crypto';
import { ApiKey, ApiLog, User } from '../../models/index.js';
import { authenticateToken } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { logAction, logAudit } from '../../utils/logging.js';

const router = express.Router();

/**
 * Generate API Key and Secret
 */
const generateApiCredentials = () => {
  const apiKey = 'sk_' + crypto.randomBytes(24).toString('hex');
  const apiSecret = crypto.randomBytes(32).toString('hex');
  return { apiKey, apiSecret };
};

/**
 * @swagger
 * /api/user/api-key:
 *   get:
 *     summary: Get user's API key
 *     tags: [User API Key]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API key details (secret is hidden)
 *       404:
 *         description: No API key found
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const apiKey = await ApiKey.findOne({
      where: { userId: req.user.id },
      attributes: ['id', 'apiKey', 'status', 'lastUsedAt', 'totalRequests', 'rateLimit', 'allowedIps', 'metadata', 'createdAt', 'updatedAt'],
    });

    if (!apiKey) {
      return res.status(404).json({
        error: 'No API key found. Please generate one.',
        code: 'API_KEY_NOT_FOUND',
      });
    }

    res.json({
      apiKey: {
        id: apiKey.id,
        apiKey: apiKey.apiKey,
        status: apiKey.status,
        lastUsedAt: apiKey.lastUsedAt,
        totalRequests: apiKey.totalRequests,
        rateLimit: apiKey.rateLimit,
        allowedIps: apiKey.allowedIps,
        metadata: apiKey.metadata,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
      },
    });
  })
);

/**
 * @swagger
 * /api/user/api-key/generate:
 *   post:
 *     summary: Generate new API key (only once per user)
 *     tags: [User API Key]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: API key generated successfully
 *       400:
 *         description: User already has an API key
 */
router.post(
  '/generate',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Check if user already has an API key
    const existingKey = await ApiKey.findOne({
      where: { userId: req.user.id },
    });

    if (existingKey) {
      return res.status(400).json({
        error: 'You already have an API key. Each user can only have one API key.',
        code: 'API_KEY_EXISTS',
        apiKey: existingKey.apiKey,
      });
    }

    // Generate new credentials
    const { apiKey, apiSecret } = generateApiCredentials();

    // Get user's IP address
    const userIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0];

    // Create API key with user's current IP
    const newApiKey = await ApiKey.create({
      userId: req.user.id,
      apiKey,
      apiSecret,
      status: 'active',
      rateLimit: 1000, // Default 1000 requests per day
      totalRequests: 0,
      allowedIps: userIp ? [userIp] : [], // Add user's current IP to allowed list
    });

    // Log to action logs
    await logAction(req, {
      userId: req.user.id,
      type: 'API_KEY_GENERATED',
      action: 'create',
      details: 'User generated new API key',
    });

    // Log to audit logs
    await logAudit(req, {
      action: 'api_key_generated',
      resource: 'api_key',
      resourceId: newApiKey.id,
      targetUserId: req.user.id,
      targetUserName: `${req.user.firstName} ${req.user.lastName}`,
      description: `User generated new API key`,
      metadata: {
        apiKey: newApiKey.apiKey,
        rateLimit: newApiKey.rateLimit,
        status: newApiKey.status,
        allowedIps: newApiKey.allowedIps,
        userIp: userIp,
      },
    });

    res.status(201).json({
      message: 'API key generated successfully',
      apiKey: {
        id: newApiKey.id,
        apiKey: newApiKey.apiKey,
        apiSecret: newApiKey.apiSecret, // Only shown once!
        status: newApiKey.status,
        rateLimit: newApiKey.rateLimit,
        createdAt: newApiKey.createdAt,
      },
      warning: 'IMPORTANT: Save your API secret now. You will not be able to see it again!',
    });
  })
);

/**
 * @swagger
 * /api/user/api-key/regenerate:
 *   post:
 *     summary: Regenerate API secret (keeps same API key)
 *     tags: [User API Key]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API secret regenerated
 *       404:
 *         description: No API key found
 */
router.post(
  '/regenerate',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const apiKey = await ApiKey.findOne({
      where: { userId: req.user.id },
    });

    if (!apiKey) {
      return res.status(404).json({
        error: 'No API key found. Please generate one first.',
        code: 'API_KEY_NOT_FOUND',
      });
    }

    // Generate new secret only
    const { apiSecret } = generateApiCredentials();

    await apiKey.update({
      apiSecret,
    });

    // Log to action logs
    await logAction(req, {
      userId: req.user.id,
      type: 'API_SECRET_REGENERATED',
      action: 'update',
      details: 'User regenerated API secret',
    });

    // Log to audit logs
    await logAudit(req, {
      action: 'api_secret_regenerated',
      resource: 'api_key',
      resourceId: apiKey.id,
      targetUserId: req.user.id,
      targetUserName: `${req.user.firstName} ${req.user.lastName}`,
      description: `User regenerated API secret`,
      metadata: {
        apiKey: apiKey.apiKey,
      },
    });

    res.json({
      message: 'API secret regenerated successfully',
      apiKey: {
        id: apiKey.id,
        apiKey: apiKey.apiKey,
        apiSecret: apiSecret, // Only shown once!
        status: apiKey.status,
      },
      warning: 'IMPORTANT: Save your new API secret now. You will not be able to see it again!',
    });
  })
);

/**
 * @swagger
 * /api/user/api-key/logs:
 *   get:
 *     summary: Get API usage logs for the current user
 *     tags: [User API Key]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: API logs retrieved successfully
 */
router.get(
  '/logs',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: logs } = await ApiLog.findAndCountAll({
      where: { userId: req.user.id },
      attributes: ['id', 'endpoint', 'method', 'statusCode', 'ipAddress', 'responseTime', 'errorMessage', 'createdAt'],
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

export default router;
