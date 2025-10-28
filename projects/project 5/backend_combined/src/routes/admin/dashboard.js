import express from 'express';
import { Op } from 'sequelize';
import { User, Order, Task, Transaction, Withdrawal } from '../../models/index.js';
import { validate, schemas } from '../../middleware/validation.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, custom]
 *           default: 30d
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/stats', 
  requirePermission('analytics.view'),
  validate(schemas.dashboardStatsQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { timeRange, startDate, endDate } = req.query;
    
    // Calculate date range
    let dateFilter = {};
    const now = new Date();
    
    if (timeRange === 'custom' && startDate && endDate) {
      dateFilter = {
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
      };
    } else {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startOfPeriod = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      dateFilter = {
        created_at: {
          [Op.gte]: startOfPeriod,
        },
      };
    }

    // Get statistics (using raw queries for aggregations)
    const [
      totalUsers,
      activeUsers,
      totalOrders,
      processingOrders,
      completedOrders,
      totalTasks,
      pendingTasks,
      approvedTasks,
      totalRevenue,
      pendingWithdrawals,
      withdrawalAmount,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { status: 'active' } }),
      Order.count(),
      Order.count({ where: { status: 'processing' } }),
      Order.count({ where: { status: 'completed' } }),
      Task.count(),
      Task.count({ where: { admin_status: 'pending' } }),
      Task.count({ where: { admin_status: 'approved' } }),
      Transaction.findOne({
        where: { type: 'order_payment', status: 'completed', ...dateFilter },
        attributes: [[Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']],
        raw: true,
      }).then(result => parseFloat(result?.total) || 0),
      Withdrawal.count({ where: { status: 'pending' } }),
      Withdrawal.findOne({
        where: { status: 'pending' },
        attributes: [[Withdrawal.sequelize.fn('SUM', Withdrawal.sequelize.col('amount')), 'total']],
        raw: true,
      }).then(result => parseFloat(result?.total) || 0),
    ]);

    // Calculate period statistics for comparison
    const previousPeriodStart = timeRange === 'custom' 
      ? new Date(new Date(startDate).getTime() - (new Date(endDate).getTime() - new Date(startDate).getTime()))
      : new Date(now.getTime() - (timeRange === '7d' ? 14 : timeRange === '30d' ? 60 : 180) * 24 * 60 * 60 * 1000);
    
    const previousPeriodEnd = timeRange === 'custom' 
      ? new Date(startDate)
      : new Date(now.getTime() - (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000);

    const [
      previousUsers,
      previousOrders,
      previousRevenue,
    ] = await Promise.all([
      User.count({
        where: {
          created_at: {
            [Op.between]: [previousPeriodStart, previousPeriodEnd],
          },
        },
      }),
      Order.count({
        where: {
          created_at: {
            [Op.between]: [previousPeriodStart, previousPeriodEnd],
          },
        },
      }),
      Transaction.findOne({
        where: {
          type: 'order_payment',
          status: 'completed',
          created_at: {
            [Op.between]: [previousPeriodStart, previousPeriodEnd],
          },
        },
        attributes: [[Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']],
        raw: true,
      }).then(result => parseFloat(result?.total) || 0),
    ]);

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (!previous || previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    const currentPeriodUsers = await User.count({ where: dateFilter });
    const currentPeriodOrders = await Order.count({ where: dateFilter });
    const currentPeriodRevenue = await Transaction.findOne({
      where: { type: 'order_payment', status: 'completed', ...dateFilter },
      attributes: [[Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']],
      raw: true,
    }).then(result => parseFloat(result?.total) || 0);

    res.json({
      revenue: {
        total: totalRevenue,
        change: calculateChange(currentPeriodRevenue, previousRevenue),
        period: timeRange,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        change: calculateChange(currentPeriodUsers, previousUsers),
      },
      orders: {
        total: totalOrders,
        processing: processingOrders,
        completed: completedOrders,
        change: calculateChange(currentPeriodOrders, previousOrders),
      },
      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        approved: approvedTasks,
        change: 15.3, // Mock change for now
      },
      withdrawals: {
        pending: pendingWithdrawals,
        amount: withdrawalAmount,
        change: -5.2, // Mock change for now
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/dashboard/chart:
 *   get:
 *     summary: Get chart data for dashboard
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Chart data
 */
router.get('/chart',
  requirePermission('analytics.view'),
  validate(schemas.dashboardStatsQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { timeRange } = req.query;
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    const chartData = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const [dayOrders, dayTasks, dayRevenue, dayUsers] = await Promise.all([
        Order.count({
          where: {
            created_at: {
              [Op.between]: [date, nextDate],
            },
          },
        }),
        Task.count({
          where: {
            created_at: {
              [Op.between]: [date, nextDate],
            },
          },
        }),
        Transaction.findOne({
          where: {
            type: 'order_payment',
            status: 'completed',
            created_at: {
              [Op.between]: [date, nextDate],
            },
          },
          attributes: [[Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']],
          raw: true,
        }).then(result => parseFloat(result?.total) || 0),
        User.count({
          where: {
            created_at: {
              [Op.between]: [date, nextDate],
            },
          },
        }),
      ]);
      
      chartData.push({
        date: dateStr,
        dateFormatted: date.toLocaleDateString(),
        orders: dayOrders,
        tasks: dayTasks,
        revenue: dayRevenue,
        users: dayUsers,
      });
    }
    
    res.json(chartData);
  })
);

/**
 * @swagger
 * /api/admin/dashboard/recent-activity:
 *   get:
 *     summary: Get recent activity for dashboard
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activity data
 */
router.get('/recent-activity',
  requirePermission('analytics.view'),
  asyncHandler(async (req, res) => {
    const [recentOrders, recentTasks, recentUsers] = await Promise.all([
      Order.findAll({
        attributes: ['id', 'userId', 'platform', 'service', 'targetUrl', 'quantity', 'amount', 'status', 'createdAt'],
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      }),
      Task.findAll({
        attributes: ['id', 'userId', 'orderId', 'type', 'platform', 'targetUrl', 'quantity', 'rate', 'status', 'adminStatus', 'createdAt'],
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      }),
      User.findAll({
        limit: 5,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'firstName', 'lastName', 'email', 'username', 'role', 'status', 'createdAt'],
      }),
    ]);

    res.json({
      recentOrders,
      recentTasks,
      recentUsers,
    });
  })
);

export default router;