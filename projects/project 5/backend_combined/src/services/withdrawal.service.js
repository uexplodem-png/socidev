  import { Transaction } from 'sequelize';
  import Withdrawal from '../models/Withdrawal.js';
  import { ApiError } from '../utils/ApiError.js';
  import { sendPaymentNotification } from '../utils/notifications.js';
  import logger from '../config/logger.js';

  export class WithdrawalService {
    async requestWithdrawal(userId, amount, method, details) {
      const transaction = await Transaction.create();

      try {
        // Validate withdrawal amount
        await this.validateWithdrawalRequest(userId, amount);

        // Create withdrawal request
        const withdrawal = await Withdrawal.create({
          userId,
          amount,
          method,
          details,
          status: 'pending'
        });

        // Send notification
        await sendPaymentNotification(userId, 'withdrawal_requested', {
          amount,
          method
        });

        await transaction.commit();
        return withdrawal;
      } catch (error) {
        await transaction.rollback();
        logger.error('Withdrawal request failed:', error);
        throw error;
      }
    }

    async processWithdrawal(withdrawalId) {
      const transaction = await Transaction.create();

      try {
        const withdrawal = await Withdrawal.findByPk(withdrawalId);
        if (!withdrawal) {
          throw new ApiError(404, 'Withdrawal not found');
        }

        // Process withdrawal based on method
        if (withdrawal.method === 'bank_transfer') {
          await this.processBankTransfer(withdrawal);
        } else if (withdrawal.method === 'crypto') {
          await this.processCryptoWithdrawal(withdrawal);
        }

        // Update withdrawal status
        await withdrawal.update({
          status: 'completed',
          processedAt: new Date()
        });

        // Send notification
        await sendPaymentNotification(withdrawal.userId, 'withdrawal_completed', {
          amount: withdrawal.amount,
          method: withdrawal.method
        });

        await transaction.commit();
        return withdrawal;
      } catch (error) {
        await transaction.rollback();
        logger.error('Withdrawal processing failed:', error);
        throw error;
      }
    }

    private async validateWithdrawalRequest(userId, amount) {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      if (user.balance < amount) {
        throw new ApiError(400, 'Insufficient balance');
      }

      // Add additional validation rules
      if (amount < 100) {
        throw new ApiError(400, 'Minimum withdrawal amount is ₺100');
      }
    }

    private async processBankTransfer(withdrawal) {
      // Implement bank transfer logic
      throw new Error('Not implemented');
    }

    private async processCryptoWithdrawal(withdrawal) {
      // Implement crypto withdrawal logic
      throw new Error('Not implemented');
    }
  }