import express from 'express';
import { ApiKey } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * Desktop App Authentication
 * Simple API key + secret authentication for desktop apps
 */
router.post('/authenticate', async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.body;

    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: 'API key and secret are required' });
    }

    // Find API key with user
    const keyRecord = await ApiKey.findOne({
      where: { apiKey },
      include: [{ association: 'user' }]
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
        id: keyRecord.user.id,
        firstName: keyRecord.user.firstName,
        lastName: keyRecord.user.lastName,
        email: keyRecord.user.email,
        username: keyRecord.user.username,
        balance: parseFloat(keyRecord.user.balance) || 0,
        status: keyRecord.user.status,
        userMode: keyRecord.user.userMode,
        apiKey: {
          id: keyRecord.id,
          rateLimit: keyRecord.rateLimit,
          totalRequests: keyRecord.totalRequests,
          lastUsedAt: keyRecord.lastUsedAt,
        },
      },
    });
  } catch (error) {
    console.error('Desktop authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

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
          association: 'user',
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
      data: keyRecord.user,
    });
  })
);

export default router;
