import { Op } from "sequelize";
import {
  InstagramAccount,
  FollowTask,
  AccountStatistics,
} from "../models/InstagramManagement.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from "bcryptjs";
import sequelize from "../config/database.js";

export class InstagramManagementService {
  async addAccount(userId, { username, password }) {
    const existingAccount = await InstagramAccount.findOne({
      where: { username },
    });

    if (existingAccount) {
      throw new ApiError(400, "Account already exists");
    }

    const dbTransaction = await sequelize.transaction();

    try {
      // Create Instagram account
      const account = await InstagramAccount.create(
        {
          userId,
          username,
          password,
          isActive: true,
        },
        { transaction: dbTransaction }
      );

      // Initialize statistics
      await AccountStatistics.create(
        {
          accountId: account.id,
        },
        { transaction: dbTransaction }
      );

      await dbTransaction.commit();

      // Return account without password
      const { password: _, ...accountData } = account.toJSON();
      return accountData;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async updateAccount(userId, accountId, { username, password }) {
    const account = await InstagramAccount.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new ApiError(404, "Account not found");
    }

    const updates = {};

    if (username) {
      const existingAccount = await InstagramAccount.findOne({
        where: {
          username,
          id: { [Op.ne]: accountId },
        },
      });

      if (existingAccount) {
        throw new ApiError(400, "Username already taken");
      }

      updates.username = username;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    await account.update(updates);

    // Return account without password
    const { password: _, ...accountData } = account.toJSON();
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

  async getAccountStatistics(userId, accountId) {
    const account = await InstagramAccount.findOne({
      where: { id: accountId, userId },
      include: [
        {
          model: AccountStatistics,
          attributes: [
            "followedCount",
            "likedCount",
            "savedCount",
            "commentedCount",
            "totalEarnings",
            "lastUpdated",
          ],
        },
      ],
    });

    if (!account) {
      throw new ApiError(404, "Account not found");
    }

    // Get recent activity
    const recentActivity = await FollowTask.findAll({
      where: {
        [Op.or]: [
          { targetAccountId: accountId },
          { followerAccountId: accountId },
        ],
        completedAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      order: [["completedAt", "DESC"]],
      limit: 10,
    });

    return {
      ...account.toJSON(),
      recentActivity,
    };
  }

  async updateStatistics(accountId) {
    const stats = await AccountStatistics.findOne({
      where: { accountId },
    });

    if (!stats) {
      throw new ApiError(404, "Statistics not found");
    }

    // Calculate new statistics
    const [followCount, likeCount, commentCount] = await Promise.all([
      FollowTask.count({
        where: {
          followerAccountId: accountId,
          status: "completed",
        },
      }),
      // Add similar counts for likes and comments when those features are implemented
      0,
      0,
    ]);

    // Update statistics
    await stats.update({
      followedCount: followCount,
      likedCount: likeCount,
      commentedCount: commentCount,
      lastUpdated: new Date(),
    });

    return stats;
  }
}
