import { Transaction, Withdrawal, Refund } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

export class AnalyticsService {
  async getBalanceHistory(userId, period = '30d') {
    const endDate = new Date();
    const startDate = this.calculateStartDate(period);

    const transactions = await Transaction.findAll({
      where: {
        userId,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['createdAt', 'ASC']]
    });

    return this.processBalanceHistory(transactions);
  }

  async getTransactionStats(userId) {
    const stats = await Transaction.findAll({
      where: { userId },
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      group: ['type']
    });

    return this.processTransactionStats(stats);
  }

  async getWithdrawalAnalytics(userId) {
    const withdrawals = await Withdrawal.findAll({
      where: { userId },
      attributes: [
        'status',
        'method',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      group: ['status', 'method']
    });

    return this.processWithdrawalAnalytics(withdrawals);
  }

  async getRefundAnalytics(userId) {
    const refunds = await Refund.findAll({
      where: { userId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      group: ['status']
    });

    return this.processRefundAnalytics(refunds);
  }

  private calculateStartDate(period) {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.setDate(now.getDate() - 7));
      case '30d':
        return new Date(now.setDate(now.getDate() - 30));
      case '90d':
        return new Date(now.setDate(now.getDate() - 90));
      case '1y':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(now.setDate(now.getDate() - 30));
    }
  }

  private processBalanceHistory(transactions) {
    let balance = 0;
    return transactions.map(transaction => {
      balance += transaction.amount;
      return {
        date: transaction.createdAt,
        amount: transaction.amount,
        balance,
        type: transaction.type
      };
    });
  }

  private processTransactionStats(stats) {
    return {
      totalDeposits: stats.find(s => s.type === 'deposit')?.total || 0,
      totalWithdrawals: stats.find(s => s.type === 'withdrawal')?.total || 0,
      totalEarnings: stats.find(s => s.type === 'task_earning')?.total || 0,
      totalSpent: stats.find(s => s.type === 'order_payment')?.total || 0
    };
  }

  private processWithdrawalAnalytics(withdrawals) {
    return {
      totalWithdrawn: withdrawals.reduce((sum, w) => sum + Number(w.total), 0),
      byMethod: withdrawals.reduce((acc, w) => {
        acc[w.method] = {
          count: w.count,
          total: w.total
        };
        return acc;
      }, {}),
      byStatus: withdrawals.reduce((acc, w) => {
        acc[w.status] = {
          count: w.count,
          total: w.total
        };
        return acc;
      }, {})
    };
  }

  private processRefundAnalytics(refunds) {
    return {
      totalRefunds: refunds.reduce((sum, r) => sum + Number(r.total), 0),
      byStatus: refunds.reduce((acc, r) => {
        acc[r.status] = {
          count: r.count,
          total: r.total
        };
        return acc;
      }, {})
    };
  }
}