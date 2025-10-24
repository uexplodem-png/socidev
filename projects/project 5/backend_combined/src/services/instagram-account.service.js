import bcrypt from "bcryptjs";
import { Sequelize } from 'sequelize';
import InstagramAccount from "../models/InstagramAccount.js";
import { ApiError } from "../utils/ApiError.js";
import { sequelize } from "../config/database.js";

export class InstagramAccountService {
  async addAccount(userId, { username, password }) {
    const existingAccount = await InstagramAccount.findOne({
      where: { username },
    });

    if (existingAccount) {
      throw new ApiError(400, "Account already exists");
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const account = await InstagramAccount.create({
      userId,
      username,
      password: hashedPassword,
      status: "active",
      lastActivity: new Date(),
      totalFollowed: 0,
      totalLikes: 0,
      totalComments: 0,
      totalEarnings: 0,
      settings: {
        autoRenew: true,
        maxDailyTasks: 10,
        notifications: {
          email: true,
          browser: true,
        },
        privacy: {
          hideStats: false,
          privateProfile: false,
        },
      },
    });

    // Return account without password
    const { password: _, ...accountData } = account.toJSON();
    return accountData;
  }

  async getAccounts(userId) {
    const accounts = await InstagramAccount.findAll({
      where: { userId },
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    // Get statistics for each account
    const accountsWithStats = await Promise.all(
      accounts.map(async (account) => {
        const stats = await this.getAccountStats(userId, account.id);
        return {
          ...account.toJSON(),
          stats,
        };
      })
    );

    return accountsWithStats;
  }

  async getAccountDetails(userId, accountId) {
    const account = await InstagramAccount.findOne({
      where: { id: accountId, userId },
      attributes: { exclude: ["password"] },
    });

    if (!account) {
      throw new ApiError(404, "Account not found");
    }

    // Get account statistics
    const stats = await this.getAccountStats(userId, accountId);

    return {
      ...account.toJSON(),
      stats,
    };
  }

  async updateSettings(userId, accountId, settings) {
    const account = await InstagramAccount.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new ApiError(404, "Account not found");
    }

    const updatedAccount = await account.update({
      settings: {
        ...account.settings,
        ...settings,
      },
    });

    // Return account without password
    const { password: _, ...accountData } = updatedAccount.toJSON();
    return accountData;
  }

  async deleteAccount(userId, accountId) {
    const account = await InstagramAccount.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new ApiError(404, "Account not found");
    }

    await account.destroy();
  }

  async getAccountStats(userId, accountId) {
    const account = await InstagramAccount.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new ApiError(404, "Account not found");
    }

    // Get total followed accounts in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentStats, totalStats] = await Promise.all([
      sequelize.query(
        `
        SELECT 
          COUNT(*) as count,
          SUM(earnings) as earnings
        FROM instagram_followed_accounts
        WHERE account_id = :accountId
        AND followed_at >= :thirtyDaysAgo
      `,
        {
          replacements: { accountId, thirtyDaysAgo },
          type: Sequelize.QueryTypes.SELECT,
        }
      ),
      sequelize.query(
        `
        SELECT 
          COUNT(*) as count,
          SUM(earnings) as earnings
        FROM instagram_followed_accounts
        WHERE account_id = :accountId
      `,
        {
          replacements: { accountId },
          type: Sequelize.QueryTypes.SELECT,
        }
      ),
    ]);

    return {
      totalFollowed: totalStats[0].count,
      totalEarnings: parseFloat(totalStats[0].earnings || 0),
      recentFollowed: recentStats[0].count,
      recentEarnings: parseFloat(recentStats[0].earnings || 0),
      lastActivity: account.lastActivity,
    };
  }
}
