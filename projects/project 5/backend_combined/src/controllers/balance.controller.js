import { BalanceService } from "../services/balance.service.js";
import { ActivityService } from "../services/activity.service.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../config/logger.js";

const balanceService = new BalanceService();
const activityService = new ActivityService();

export class BalanceController {
  // Add balance
  addBalance = catchAsync(async (req, res) => {
    const { amount, method, details } = req.body;
    const userId = req.user.id;

    logger.info('Add balance request', { userId, amount, method });

    if (!amount || amount <= 0) {
      throw new ApiError(400, "Invalid amount");
    }

    try {
      // Pass request object to service for IP tracking in audit logs
      const transaction = await balanceService.createDeposit(
        userId,
        amount,
        method,
        details,
        req
      );

      // Log activity with IP address
      try {
        await activityService.logActivity(
          userId,
          'balance',
          'add_balance',
          {
            amount,
            method,
            transactionId: transaction.id,
            status: transaction.status,
          },
          req
        );
      } catch (activityError) {
        logger.error('Failed to log add balance activity', { error: activityError.message });
      }

      res.status(201).json(transaction);
    } catch (error) {
      logger.error('Add balance error', { error: error.message, userId, amount });
      throw error;
    }
  });

  // Withdraw balance
  withdrawBalance = catchAsync(async (req, res) => {
    const { amount, method, details } = req.body;
    const userId = req.user.id;

    logger.info('Withdraw balance request', { userId, amount, method });

    if (!amount || amount <= 0) {
      throw new ApiError(400, "Invalid amount");
    }

    try {
      // Pass request object to service for IP tracking in audit logs
      const transaction = await balanceService.createWithdrawal(
        userId,
        amount,
        method,
        details,
        req
      );

      // Log activity with IP address
      try {
        await activityService.logActivity(
          userId,
          'balance',
          'withdraw_balance',
          {
            amount,
            method,
            transactionId: transaction.id,
            status: transaction.status,
          },
          req
        );
      } catch (activityError) {
        logger.error('Failed to log withdraw balance activity', { error: activityError.message });
      }

      res.status(201).json(transaction);
    } catch (error) {
      logger.error('Withdraw balance error', { error: error.message, userId, amount });
      throw error;
    }
  });

  // Get transactions
  getTransactions = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { type, status, page = 1, limit = 10 } = req.query;

    const transactions = await balanceService.getTransactions(userId, {
      type,
      status,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json(transactions);
  });

  // Get balance
  getBalance = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const balance = await balanceService.getBalance(userId);
    res.json({ balance });
  });
}
