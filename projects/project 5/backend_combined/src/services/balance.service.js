import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { AuditLog } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { sequelize } from "../config/database.js";
import logger from "../config/logger.js";

export class BalanceService {
  /**
   * Extract IP address from request object
   */
  getClientIp(req) {
    if (!req) return '0.0.0.0';
    return (
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.connection?.socket?.remoteAddress ||
      '0.0.0.0'
    );
  }

  /**
   * Extract user agent from request object
   */
  getUserAgent(req) {
    if (!req) return null;
    return req.headers['user-agent'] || req.get?.('user-agent') || null;
  }

  async createDeposit(userId, amount, method, details = {}, req = null) {
    const dbTransaction = await sequelize.transaction();
    let userData = null;

    try {
      const user = await User.findByPk(userId, { transaction: dbTransaction });
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      // Store user data for logging (before transaction completes)
      // Handle both camelCase and snake_case field names
      userData = {
        firstName: user.firstName || user.first_name || '',
        lastName: user.lastName || user.last_name || '',
        email: user.email || '',
      };

      const depositTransaction = await Transaction.create(
        {
          userId,
          type: "deposit",
          amount,
          method,
          description: `Deposit via ${method}`,
          status: method === "balance" ? "completed" : "pending",
        },
        { transaction: dbTransaction }
      );

      if (method === "balance") {
        await user.increment("balance", {
          by: amount,
          transaction: dbTransaction,
        });
      }

      await dbTransaction.commit();

      // Log the action after transaction commits
      try {
        const ipAddress = this.getClientIp(req);
        const userAgent = this.getUserAgent(req);
        const actorName = `${userData.firstName} ${userData.lastName}`.trim() || 'Unknown User';
        
        // Ensure values are not null/undefined
        if (!userData.email) {
          logger.warn('User email is missing, using placeholder', { userId });
          userData.email = 'unknown@system.local';
        }
        if (!userData.firstName && !userData.lastName) {
          logger.warn('User name is missing, using placeholder', { userId });
        }

        await AuditLog.create({
          actor_id: userId,
          actor_name: actorName || 'Unknown User',
          actor_email: userData.email || 'unknown@system.local',
          action: 'BALANCE_DEPOSIT',
          resource: 'transaction',
          resource_id: depositTransaction.id,
          target_user_id: userId,
          target_user_name: actorName || 'Unknown User',
          description: `Deposit request for $${amount} via ${method}`,
          metadata: {
            type: 'deposit',
            amount,
            method,
            status: depositTransaction.status,
          },
          ip_address: ipAddress,
          user_agent: userAgent,
        });
        logger.info('Balance deposit logged', { userId, amount, method, transactionId: depositTransaction.id });
      } catch (logError) {
        logger.error('Failed to log deposit:', logError);
      }

      return depositTransaction;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async createWithdrawal(userId, amount, method, details = {}, req = null) {
    const dbTransaction = await sequelize.transaction();
    let userData = null;

    try {
      const user = await User.findByPk(userId, { transaction: dbTransaction });
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      if (user.balance < amount) {
        throw new ApiError(400, "Insufficient balance");
      }

      // Store user data for logging (before transaction completes)
      userData = {
        firstName: user.firstName || user.first_name || '',
        lastName: user.lastName || user.last_name || '',
        email: user.email || '',
      };

      // Create withdrawal transaction with negative amount
      const withdrawalTransaction = await Transaction.create(
        {
          userId,
          type: "withdrawal",
          amount: -amount, // Store as negative to represent money leaving the account
          method,
          description: `Withdrawal via ${method}`,
          status: "pending",
        },
        { transaction: dbTransaction }
      );

      // Immediately deduct the amount from user's balance
      await user.decrement("balance", {
        by: amount,
        transaction: dbTransaction,
      });

      await dbTransaction.commit();

      // Log the action after transaction commits
      try {
        const ipAddress = this.getClientIp(req);
        const userAgent = this.getUserAgent(req);
        const actorName = `${userData.firstName} ${userData.lastName}`.trim() || 'Unknown User';
        
        // Ensure values are not null/undefined
        if (!userData.email) {
          logger.warn('User email is missing, using placeholder', { userId });
          userData.email = 'unknown@system.local';
        }
        if (!userData.firstName && !userData.lastName) {
          logger.warn('User name is missing, using placeholder', { userId });
        }

        await AuditLog.create({
          actor_id: userId,
          actor_name: actorName || 'Unknown User',
          actor_email: userData.email || 'unknown@system.local',
          action: 'BALANCE_WITHDRAWAL',
          resource: 'transaction',
          resource_id: withdrawalTransaction.id,
          target_user_id: userId,
          target_user_name: actorName || 'Unknown User',
          description: `Withdrawal request for $${amount} via ${method}`,
          metadata: {
            type: 'withdrawal',
            amount,
            method,
            status: withdrawalTransaction.status,
          },
          ip_address: ipAddress,
          user_agent: userAgent,
        });
        logger.info('Balance withdrawal logged', { userId, amount, method, transactionId: withdrawalTransaction.id });
      } catch (logError) {
        logger.error('Failed to log withdrawal:', logError);
      }

      return withdrawalTransaction;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async approveWithdrawal(transactionId) {
    const dbTransaction = await sequelize.transaction();
    let userData = null;

    try {
      const transaction = await Transaction.findByPk(transactionId, {
        include: [{ model: User, as: 'user' }],
        transaction: dbTransaction,
      });
      if (!transaction) {
        throw new ApiError(404, "Transaction not found");
      }

      if (transaction.type !== "withdrawal") {
        throw new ApiError(400, "Invalid transaction type");
      }

      if (transaction.status !== "pending") {
        throw new ApiError(400, "Transaction already processed");
      }

      // Store user data for logging
      userData = {
        firstName: transaction.user.firstName || transaction.user.first_name || '',
        lastName: transaction.user.lastName || transaction.user.last_name || '',
        email: transaction.user.email || '',
      };

      // Update transaction status
      await transaction.update(
        {
          status: "completed",
        },
        { transaction: dbTransaction }
      );

      await dbTransaction.commit();

      // Log the action
      try {
        const actorName = `${userData.firstName} ${userData.lastName}`.trim() || 'Unknown User';
        
        // Ensure values are not null/undefined
        if (!userData.email) {
          logger.warn('User email is missing, using placeholder', { transactionId });
          userData.email = 'unknown@system.local';
        }
        if (!userData.firstName && !userData.lastName) {
          logger.warn('User name is missing, using placeholder', { transactionId });
        }

        await AuditLog.create({
          actor_id: transaction.userId,
          actor_name: actorName || 'Unknown User',
          actor_email: userData.email || 'unknown@system.local',
          action: 'WITHDRAWAL_APPROVED',
          resource: 'transaction',
          resource_id: transaction.id,
          target_user_id: transaction.userId,
          target_user_name: actorName || 'Unknown User',
          description: `Withdrawal approved for $${Math.abs(transaction.amount)} via ${transaction.method}`,
          metadata: {
            status: 'completed',
            amount: transaction.amount,
            method: transaction.method,
          },
          ip_address: '0.0.0.0',
          user_agent: null,
        });
      } catch (logError) {
        logger.error('Failed to log withdrawal approval:', logError);
      }

      return transaction;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async rejectWithdrawal(transactionId) {
    const dbTransaction = await sequelize.transaction();
    let userData = null;

    try {
      const transaction = await Transaction.findByPk(transactionId, {
        include: [{ model: User, as: 'user' }],
        transaction: dbTransaction,
      });

      if (!transaction) {
        throw new ApiError(404, "Transaction not found");
      }

      if (transaction.type !== "withdrawal") {
        throw new ApiError(400, "Invalid transaction type");
      }

      if (transaction.status !== "pending") {
        throw new ApiError(400, "Transaction already processed");
      }

      // Store user data for logging
      userData = {
        firstName: transaction.user.firstName || transaction.user.first_name || '',
        lastName: transaction.user.lastName || transaction.user.last_name || '',
        email: transaction.user.email || '',
      };

      // Refund the amount back to user's balance
      await transaction.user.increment("balance", {
        by: Math.abs(transaction.amount), // Convert negative amount back to positive
        transaction: dbTransaction,
      });

      // Update transaction status
      await transaction.update(
        {
          status: "rejected",
        },
        { transaction: dbTransaction }
      );

      await dbTransaction.commit();

      // Log the action
      try {
        const actorName = `${userData.firstName} ${userData.lastName}`.trim() || 'Unknown User';
        
        // Ensure values are not null/undefined
        if (!userData.email) {
          logger.warn('User email is missing, using placeholder', { transactionId });
          userData.email = 'unknown@system.local';
        }
        if (!userData.firstName && !userData.lastName) {
          logger.warn('User name is missing, using placeholder', { transactionId });
        }

        await AuditLog.create({
          actor_id: transaction.userId,
          actor_name: actorName || 'Unknown User',
          actor_email: userData.email || 'unknown@system.local',
          action: 'WITHDRAWAL_REJECTED',
          resource: 'transaction',
          resource_id: transaction.id,
          target_user_id: transaction.userId,
          target_user_name: actorName || 'Unknown User',
          description: `Withdrawal rejected for $${Math.abs(transaction.amount)} via ${transaction.method} - Refunded to balance`,
          metadata: {
            status: 'rejected',
            amount: transaction.amount,
            method: transaction.method,
            refunded: true,
          },
          ip_address: '0.0.0.0',
          user_agent: null,
        });
      } catch (logError) {
        logger.error('Failed to log withdrawal rejection:', logError);
      }

      return transaction;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async getTransactions(userId, { type, status, page = 1, limit = 10 }) {
    const where = { userId };
    if (type) where.type = type;
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { rows: transactions, count } = await Transaction.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return {
      transactions,
      pagination: {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getBalance(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return user.balance;
  }
}
