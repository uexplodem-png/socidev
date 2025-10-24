import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import Order from "../models/Order.js";
import OrderStatistics from "../models/OrderStatistics.js";

export class StatisticsService {
  async calculateAndUpdateStats(
    userId,
    { platform = null, timeframe = "30d", transaction = null } = {}
  ) {
    // Skip if no platform is provided
    if (!platform) {
      return null;
    }

    const timeframeMap = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365,
    };

    const days = timeframeMap[timeframe] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Calculate current period stats
    const currentStats = await this.calculatePeriodStats(
      userId,
      startDate,
      new Date(),
      platform
    );

    // Calculate previous period stats for growth
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);
    const previousStats = await this.calculatePeriodStats(
      userId,
      previousStartDate,
      startDate,
      platform
    );

    // Calculate growth rates
    const stats = {
      userId,
      platform,
      timeframe,
      activeOrders: currentStats.activeOrders,
      completedOrders: currentStats.completedOrders,
      totalOrders: currentStats.totalOrders,
      totalSpent: currentStats.totalSpent,
      activeOrdersGrowth: this.calculateGrowth(
        currentStats.activeOrders,
        previousStats.activeOrders
      ),
      completedOrdersGrowth: this.calculateGrowth(
        currentStats.completedOrders,
        previousStats.completedOrders
      ),
      totalOrdersGrowth: this.calculateGrowth(
        currentStats.totalOrders,
        previousStats.totalOrders
      ),
      totalSpentGrowth: this.calculateGrowth(
        currentStats.totalSpent,
        previousStats.totalSpent
      ),
      lastCalculatedAt: new Date(),
    };

    try {
      // Find existing stats record
      const [existingStats, created] = await OrderStatistics.findOrCreate({
        where: {
          userId,
          platform,
          timeframe,
        },
        defaults: stats,
        transaction,
      });

      if (!created) {
        // Update existing record
        await existingStats.update(stats, { transaction });
      }

      return stats;
    } catch (error) {
      console.error("Error updating statistics:", error);
      throw error;
    }
  }

  async calculatePeriodStats(userId, startDate, endDate, platform) {
    const where = {
      userId,
      platform,
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    };

    const [stats] = await Order.findAll({
      where,
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "total_orders"],
        [sequelize.fn("SUM", sequelize.col("amount")), "total_spent"],
        [
          sequelize.literal(
            `SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`
          ),
          "completed_orders",
        ],
        [
          sequelize.literal(
            `SUM(CASE WHEN status IN ('pending', 'processing') THEN 1 ELSE 0 END)`
          ),
          "active_orders",
        ],
      ],
      raw: true,
    });

    return {
      activeOrders: parseInt(stats?.active_orders || 0),
      completedOrders: parseInt(stats?.completed_orders || 0),
      totalOrders: parseInt(stats?.total_orders || 0),
      totalSpent: parseFloat(stats?.total_spent || 0),
    };
  }

  calculateGrowth(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  async getStats(userId, { platform = null, timeframe = "30d" } = {}) {
    // Skip if no platform is provided
    if (!platform) {
      return null;
    }

    try {
      const existingStats = await OrderStatistics.findOne({
        where: {
          userId,
          platform,
          timeframe,
        },
      });

      const needsUpdate =
        !existingStats ||
        new Date().getTime() -
          new Date(existingStats.lastCalculatedAt).getTime() >
          15 * 60 * 1000;

      if (needsUpdate) {
        return this.calculateAndUpdateStats(userId, { platform, timeframe });
      }

      return existingStats;
    } catch (error) {
      console.error("Error getting stats:", error);
      return {
        activeOrders: 0,
        completedOrders: 0,
        totalOrders: 0,
        totalSpent: 0,
        activeOrdersGrowth: 0,
        completedOrdersGrowth: 0,
        totalOrdersGrowth: 0,
        totalSpentGrowth: 0,
        lastCalculatedAt: new Date(),
      };
    }
  }
}
