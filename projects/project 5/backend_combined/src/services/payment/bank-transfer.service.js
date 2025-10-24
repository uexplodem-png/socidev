import { ApiError } from '../../utils/ApiError.js';
import logger from '../../config/logger.js';
import { Transaction } from '../../models/Transaction.js';
import { sendPaymentNotification } from '../../utils/notifications.js';

export class BankTransferService {
  async createTransfer(userId, amount, bankDetails) {
    try {
      // Validate bank details
      this.validateBankDetails(bankDetails);

      // Create transfer record
      const transfer = await Transaction.create({
        userId,
        type: 'bank_transfer',
        amount,
        status: 'pending',
        details: {
          bankName: bankDetails.bankName,
          accountHolder: bankDetails.accountHolder,
          iban: bankDetails.iban,
          reference: this.generateReference()
        }
      });

      // Send notification with transfer instructions
      await sendPaymentNotification(userId, 'bank_transfer_instructions', {
        amount,
        reference: transfer.details.reference,
        bankDetails: {
          bankName: process.env.MERCHANT_BANK_NAME,
          accountHolder: process.env.MERCHANT_ACCOUNT_HOLDER,
          iban: process.env.MERCHANT_IBAN
        }
      });

      return transfer;
    } catch (error) {
      logger.error('Bank transfer creation failed:', error);
      throw new ApiError(500, 'Transfer processing failed');
    }
  }

  async verifyTransfer(transferId) {
    try {
      const transfer = await Transaction.findByPk(transferId);
      if (!transfer) {
        throw new ApiError(404, 'Transfer not found');
      }

      // In a real implementation, this would check with the bank's API
      const isVerified = await this.checkBankTransfer(transfer.details.reference);

      if (isVerified) {
        await transfer.update({ status: 'completed' });
        await sendPaymentNotification(transfer.userId, 'bank_transfer_confirmed', {
          amount: transfer.amount,
          reference: transfer.details.reference
        });
      }

      return {
        status: transfer.status,
        verified: isVerified
      };
    } catch (error) {
      logger.error('Bank transfer verification failed:', error);
      throw new ApiError(500, 'Transfer verification failed');
    }
  }

  async processRefund(userId, amount, bankDetails) {
    try {
      // Validate bank details
      this.validateBankDetails(bankDetails);

      // Create refund record
      const refund = await Transaction.create({
        userId,
        type: 'bank_transfer_refund',
        amount: -amount,
        status: 'pending',
        details: {
          bankName: bankDetails.bankName,
          accountHolder: bankDetails.accountHolder,
          iban: bankDetails.iban,
          reference: this.generateReference()
        }
      });

      // In a real implementation, this would initiate the bank transfer
      await this.initiateBankTransfer(bankDetails.iban, amount, refund.details.reference);

      await sendPaymentNotification(userId, 'refund_initiated', {
        amount,
        reference: refund.details.reference
      });

      return refund;
    } catch (error) {
      logger.error('Bank transfer refund failed:', error);
      throw new ApiError(500, 'Refund processing failed');
    }
  }

  private validateBankDetails(details) {
    if (!details.bankName || !details.accountHolder || !details.iban) {
      throw new ApiError(400, 'Invalid bank details');
    }

    // Validate IBAN format
    if (!this.isValidIBAN(details.iban)) {
      throw new ApiError(400, 'Invalid IBAN');
    }
  }

  private isValidIBAN(iban) {
    // Implement IBAN validation logic
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
    return ibanRegex.test(iban.replace(/\s/g, ''));
  }

  private generateReference() {
    return `BT${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
  }

  private async checkBankTransfer(reference) {
    // In a real implementation, this would check with the bank's API
    return new Promise(resolve => setTimeout(() => resolve(true), 1000));
  }

  private async initiateBankTransfer(iban, amount, reference) {
    // In a real implementation, this would use the bank's API
    return new Promise(resolve => setTimeout(resolve, 1000));
  }
}