import express from 'express';
import { ApiKey } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * Desktop App Authentication
 * Simple API key + secret authentication for desktop apps
 */
router.post(
  '/authenticate',
  asyncHandler(async (req, res) => {
    const { apiKey, apiSecret } = req.body;

    // Validate input
    if (!apiKey || !apiSecret) {
      return res.status(400).json({
        success: false,
        error: 'API key and secret are required',
      });
    }

    // Find API key
    const keyRecord = await ApiKey.findOne({
      where: { apiKey },
      include: [
        {
          association: 'User',
          attributes: ['id', 'firstName', 'lastName', 'email', 'username', 'balance', 'status', 'userMode'],
        },
      ],
    });

    if (!keyRecord) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API credentials',
      });
    }

    // Verify secret
    if (keyRecord.apiSecret !== apiSecret) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API credentials',
      });
    }

    // Check status
    if (keyRecord.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: `API key is ${keyRecord.status}`,
      });
    }

    // Return user info
    res.json({
      success: true,
      data: {
        id: keyRecord.User.id,
        firstName: keyRecord.User.firstName,
        lastName: keyRecord.User.lastName,
        email: keyRecord.User.email,
        username: keyRecord.User.username,
        balance: parseFloat(keyRecord.User.balance) || 0,
        status: keyRecord.User.status,
        userMode: keyRecord.User.userMode,
        apiKey: {
          id: keyRecord.id,
          rateLimit: keyRecord.rateLimit,
          totalRequests: keyRecord.totalRequests,
          lastUsedAt: keyRecord.lastUsedAt,
        },
      },
    });
  })
);

/**
 * Get user info (requires valid API key + secret in headers)
 */
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const apiSecret = req.headers['x-api-secret'];

    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        success: false,
        error: 'API key and secret required in headers',
      });
    }

    // Find and validate
    const keyRecord = await ApiKey.findOne({
      where: { apiKey, apiSecret, status: 'active' },
      include: [
        {
          association: 'User',
          attributes: ['id', 'firstName', 'lastName', 'email', 'username', 'balance', 'status', 'userMode'],
        },
      ],
    });

    if (!keyRecord) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API credentials',
      });
    }

    // Update last used
    await keyRecord.update({
      lastUsedAt: new Date(),
      totalRequests: keyRecord.totalRequests + 1,
    });

    res.json({
      success: true,
      data: keyRecord.User,
    });
  })
);

export default router;
