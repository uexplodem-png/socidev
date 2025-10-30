import { SocialAccount } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export class SocialAccountService {
  async addAccount(userId, { platform, username, credentials }) {
    try {
      const account = await SocialAccount.create({
        userId: userId,
        platform,
        username,
        accessToken: credentials?.accessToken,
        refreshToken: credentials?.refreshToken
      });
      
      return account;
    } catch (error) {
      console.error('Error adding social account:', error);
      throw new ApiError(500, `Failed to add social account: ${error.message}`);
    }
  }

  async getAccounts(userId, { platform } = {}) {
    try {
      const whereClause = { userId: userId };
      if (platform) {
        whereClause.platform = platform;
      }
      
      const accounts = await SocialAccount.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });
      
      return accounts;
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch social accounts');
    }
  }

  async getAccountDetails(userId, accountId) {
    try {
      const account = await SocialAccount.findOne({
        where: { id: accountId, userId: userId }
      });
      
      if (!account) {
        throw new ApiError(404, 'Social account not found');
      }
      
      return account;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch social account details');
    }
  }

  async updateAccountSettings(userId, accountId, settings) {
    try {
      const account = await SocialAccount.findOne({
        where: { id: accountId, userId: userId }
      });
      
      if (!account) {
        throw new ApiError(404, 'Social account not found');
      }
      
      await account.update({ accountData: settings });
      return account;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to update social account settings');
    }
  }

  async deleteAccount(userId, accountId) {
    try {
      const account = await SocialAccount.findOne({
        where: { id: accountId, userId: userId }
      });
      
      if (!account) {
        throw new ApiError(404, 'Social account not found');
      }
      
      await account.destroy();
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to delete social account');
    }
  }

  async getAccountStats(userId, accountId) {
    try {
      const account = await SocialAccount.findOne({
        where: { id: accountId, userId: userId }
      });
      
      if (!account) {
        throw new ApiError(404, 'Social account not found');
      }
      
      // Return basic stats, you can expand this based on your needs
      return {
        id: account.id,
        platform: account.platform,
        username: account.username,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch social account stats');
    }
  }
}