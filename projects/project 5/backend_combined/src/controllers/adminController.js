import { UserService } from '../services/userService.js';
import { OrderService } from '../services/orderService.js';
import { AuditLog } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export class AdminController {
  /**
   * Get dashboard statistics
   */
  static getDashboardStats = asyncHandler(async (req, res) => {
    const { timeRange } = req.query;

    const [userStats, orderStats] = await Promise.all([
      UserService.getUserStatistics(timeRange),
      OrderService.getOrderStatistics(timeRange),
    ]);

    res.json({
      users: userStats.summary,
      orders: orderStats.summary,
      platforms: orderStats.platformBreakdown,
      period: timeRange,
    });
  });

  /**
   * Get system health
   */
  static getSystemHealth = asyncHandler(async (req, res) => {
    // In a real implementation, this would check various system components
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        redis: 'healthy',
        email: 'healthy',
        storage: 'healthy',
      },
      metrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };

    res.json(health);
  });

  /**
   * Get recent activity
   */
  static getRecentActivity = asyncHandler(async (req, res) => {
    const recentLogs = await AuditLog.findAll({
      limit: 20,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
      ],
    });

    res.json({
      activities: recentLogs,
    });
  });
}

export default AdminController;