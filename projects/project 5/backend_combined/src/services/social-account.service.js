import { SocialAccount } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export class SocialAccountService {
  async addAccount(userId, platform, username, accessToken, refreshToken) {
    try {
      const account = await SocialAccount.create({
        user_id: userId,
        platform,
        username,
        access_token: accessToken,
        refresh_token: refreshToken
      });
      
      return account;
    } catch (error) {
      throw new ApiError(500, 'Failed to add social account');
    }
  }

  async getAccounts(userId) {
    try {
      const accounts = await SocialAccount.findAll({
        where: { user_id: userId },
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
        where: { id: accountId, user_id: userId }
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
        where: { id: accountId, user_id: userId }
      });
      
      if (!account) {
        throw new ApiError(404, 'Social account not found');
      }
      
      await account.update({ account_data: settings });
      return account;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to update social account settings');
    }
  }

  async deleteAccount(userId, accountId) {
    try {
      const account = await SocialAccount.findOne({
        where: { id: accountId, user_id: userId }
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
        where: { id: accountId, user_id: userId }
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