import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import desktopApiKeyService from '../services/desktop-api-key.service.js';
import logger from '../config/logger.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/desktop-keys
 * Create a new desktop API key
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, permissions, rateLimit, ipWhitelist, expiresAt } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    const apiKey = await desktopApiKeyService.createApiKey(userId, name, {
      permissions,
      rateLimit,
      ipWhitelist,
      expiresAt
    });

    res.status(201).json({
      success: true,
      data: apiKey,
      message: 'API key created successfully. Save the API key and secret securely - they will not be shown again!'
    });
  } catch (error) {
    logger.error('Error creating desktop API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create API key'
    });
  }
});

/**
 * GET /api/desktop-keys
 * Get all desktop API keys for current user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const apiKeys = await desktopApiKeyService.getUserApiKeys(userId);

    res.json({
      success: true,
      data: apiKeys
    });
  } catch (error) {
    logger.error('Error fetching desktop API keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API keys'
    });
  }
});

/**
 * GET /api/desktop-keys/:keyId
 * Get specific API key details
 */
router.get('/:keyId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;

    const stats = await desktopApiKeyService.getApiKeyStats(keyId, userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching API key stats:', error);
    res.status(404).json({
      success: false,
      error: 'API key not found'
    });
  }
});

/**
 * PUT /api/desktop-keys/:keyId
 * Update desktop API key
 */
router.put('/:keyId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;
    const updates = req.body;

    const updatedKey = await desktopApiKeyService.updateApiKey(keyId, userId, updates);

    res.json({
      success: true,
      data: updatedKey,
      message: 'API key updated successfully'
    });
  } catch (error) {
    logger.error('Error updating desktop API key:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update API key'
    });
  }
});

/**
 * POST /api/desktop-keys/:keyId/revoke
 * Revoke desktop API key
 */
router.post('/:keyId/revoke', async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;

    const result = await desktopApiKeyService.revokeApiKey(keyId, userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error revoking desktop API key:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to revoke API key'
    });
  }
});

/**
 * DELETE /api/desktop-keys/:keyId
 * Delete desktop API key
 */
router.delete('/:keyId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;

    const result = await desktopApiKeyService.deleteApiKey(keyId, userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error deleting desktop API key:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete API key'
    });
  }
});

export default router;
