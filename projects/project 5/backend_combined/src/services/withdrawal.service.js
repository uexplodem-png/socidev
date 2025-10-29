  import { Transaction } from 'sequelize';
  import Withdrawal from '../models/Withdrawal.js';
  import User from '../models/User.js';
  import { ApiError } from '../utils/ApiError.js';
  import { sendPaymentNotification } from '../utils/notifications.js';
  import logger from '../config/logger.js';
  import { settingsService } from './settingsService.js';

  export class WithdrawalService {
    async requestWithdrawal(userId, amount, method, details) {
      const transaction = await Transaction.create();

      try {
        // Validate withdrawal amount and calculate fee
        const { fee, totalAmount } = await this.validateWithdrawalRequest(userId, amount);

        // Create withdrawal request
        const withdrawal = await Withdrawal.create({
          userId,
          amount,
          fee,
          totalAmount,
          method,
          details,
          status: 'pending'
        });

        // Send email notification (async, don't wait)
        try {
          const user = await User.findByPk(userId);
          if (user) {
            const { emailService } = await import('./email.service.js');
            emailService.sendWithdrawalRequestEmail(user, withdrawal).catch(err => {
              logger.error('Failed to send withdrawal request email', { userId, error: err.message });
            });
          }
        } catch (emailError) {
          logger.error('Failed to send withdrawal email', { error: emailError.message });
        }

        // Send notification
        await sendPaymentNotification(userId, 'withdrawal_requested', {
          amount,
          fee,
          totalAmount,
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

    async validateWithdrawalRequest(userId, amount) {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Get minimum withdrawal amount from settings
      const minWithdrawalAmount = await settingsService.get('withdrawal.minAmount', 10);
      if (amount < minWithdrawalAmount) {
        throw new ApiError(400, `Minimum withdrawal amount is ₺${minWithdrawalAmount}`);
      }

      // Get withdrawal fee percentage from settings
      const withdrawalFeePercent = await settingsService.get('withdrawal.feePercent', 0);
      const fee = (amount * withdrawalFeePercent) / 100;
      const totalAmount = amount + fee;

      if (user.balance < totalAmount) {
        throw new ApiError(
          400, 
          `Insufficient balance. Required: ₺${totalAmount.toFixed(2)} (Amount: ₺${amount.toFixed(2)} + Fee: ₺${fee.toFixed(2)})`
        );
      }

      return { fee, totalAmount };
    }

    async processBankTransfer(withdrawal) {
      // Implement bank transfer logic
      throw new Error('Not implemented');
    }

    async processCryptoWithdrawal(withdrawal) {
      // Implement crypto withdrawal logic
      throw new Error('Not implemented');
    }
  }