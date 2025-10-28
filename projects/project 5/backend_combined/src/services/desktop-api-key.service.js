import DesktopApiKey from '../models/DesktopApiKey.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

class DesktopApiKeyService {
  // Create new API key
  async createApiKey(userId, name, options = {}) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate key pair
      const { apiKey, apiSecret, hashedKey } = DesktopApiKey.generateKeyPair();

      // Create API key record
      const apiKeyRecord = await DesktopApiKey.create({
        userId,
        name,
        apiKey: hashedKey,
        apiSecret,
        permissions: options.permissions || {
          getTasks: true,
          getTaskDetails: true,
          getInProgressTasks: true,
          completeTask: true,
          uploadScreenshot: true
        },
        rateLimit: options.rateLimit || 1000,
        ipWhitelist: options.ipWhitelist || [],
        expiresAt: options.expiresAt || null
      });

      logger.info('API key created', { userId, name, keyId: apiKeyRecord.id });

      // Return the plain API key and secret (only shown once)
      return {
        id: apiKeyRecord.id,
        name: apiKeyRecord.name,
        apiKey, // Plain text (never stored)
        apiSecret, // Plain text (never shown again)
        permissions: apiKeyRecord.permissions,
        rateLimit: apiKeyRecord.rateLimit,
        ipWhitelist: apiKeyRecord.ipWhitelist,
        status: apiKeyRecord.status,
        createdAt: apiKeyRecord.createdAt
      };
    } catch (error) {
      logger.error('Error creating API key:', error);
      throw error;
    }
  }

  // Get all API keys for user (without secrets)
  async getUserApiKeys(userId) {
    try {
      const apiKeys = await DesktopApiKey.findAll({
        where: { userId },
        attributes: { exclude: ['apiKey', 'apiSecret'] },
        order: [['createdAt', 'DESC']]
      });

      return apiKeys;
    } catch (error) {
      logger.error('Error fetching API keys:', error);
      throw error;
    }
  }

  // Update API key
  async updateApiKey(keyId, userId, updates) {
    try {
      const apiKey = await DesktopApiKey.findOne({
        where: { id: keyId, userId }
      });

      if (!apiKey) {
        throw new Error('API key not found');
      }

      // Only allow updating certain fields
      const allowedUpdates = {
        name: updates.name,
        permissions: updates.permissions,
        rateLimit: updates.rateLimit,
        ipWhitelist: updates.ipWhitelist,
        status: updates.status,
        expiresAt: updates.expiresAt
      };

      // Remove undefined values
      Object.keys(allowedUpdates).forEach(key => 
        allowedUpdates[key] === undefined && delete allowedUpdates[key]
      );

      await apiKey.update(allowedUpdates);

      logger.info('API key updated', { userId, keyId, updates: Object.keys(allowedUpdates) });

      return {
        id: apiKey.id,
        name: apiKey.name,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        ipWhitelist: apiKey.ipWhitelist,
        status: apiKey.status,
        expiresAt: apiKey.expiresAt,
        updatedAt: apiKey.updatedAt
      };
    } catch (error) {
      logger.error('Error updating API key:', error);
      throw error;
    }
  }

  // Revoke API key
  async revokeApiKey(keyId, userId) {
    try {
      const apiKey = await DesktopApiKey.findOne({
        where: { id: keyId, userId }
      });

      if (!apiKey) {
        throw new Error('API key not found');
      }

      await apiKey.update({ status: 'revoked' });

      logger.info('API key revoked', { userId, keyId });

      return { success: true, message: 'API key revoked' };
    } catch (error) {
      logger.error('Error revoking API key:', error);
      throw error;
    }
  }

  // Delete API key
  async deleteApiKey(keyId, userId) {
    try {
      const apiKey = await DesktopApiKey.findOne({
        where: { id: keyId, userId }
      });

      if (!apiKey) {
        throw new Error('API key not found');
      }

      await apiKey.destroy();

      logger.info('API key deleted', { userId, keyId });

      return { success: true, message: 'API key deleted' };
    } catch (error) {
      logger.error('Error deleting API key:', error);
      throw error;
    }
  }

  // Get API key statistics
  async getApiKeyStats(keyId, userId) {
    try {
      const apiKey = await DesktopApiKey.findOne({
        where: { id: keyId, userId },
        attributes: ['id', 'name', 'requestCount', 'lastUsedAt', 'lastUsedIp', 'status', 'createdAt']
      });

      if (!apiKey) {
        throw new Error('API key not found');
      }

      return apiKey;
    } catch (error) {
      logger.error('Error fetching API key stats:', error);
      throw error;
    }
  }
}

export default new DesktopApiKeyService();
