import { Op } from "sequelize";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Transaction from "../models/Transaction.js";
import { ApiError } from "../utils/ApiError.js";
import sequelize from "../config/database.js";
import { StatisticsService } from "./statistics.service.js";

export class OrderService {
  constructor() {
    this.statisticsService = new StatisticsService();
  }

  async getOrders(
    userId,
    {
      filters = {},
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = {}
  ) {
    const where = { userId };

    if (filters.status) where.status = filters.status;
    if (filters.platform) where.platform = filters.platform;
    if (filters.service) where.service = filters.service;
    if (filters.startDate)
      where.createdAt = { [Op.gte]: new Date(filters.startDate) };
    if (filters.endDate) {
      where.createdAt = {
        ...where.createdAt,
        [Op.lte]: new Date(filters.endDate),
      };
    }

    const { rows: orders, count } = await Order.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: User,
          attributes: ["id", "username"],
        },
      ],
    });

    return {
      orders,
      pagination: {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getOrderStats(userId, { platform, timeframe = "30d" } = {}) {
    const stats = await this.statisticsService.getStats(userId, {
      platform,
      timeframe,
    });
    return stats;
  }

  async getOrderDetails(userId, orderId) {
    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: [
        {
          model: User,
          attributes: ["id", "username"],
        },
      ],
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return order;
  }

  async createOrder(userId, orderData) {
    const dbTransaction = await sequelize.transaction();

    try {
      const user = await User.findByPk(userId, { transaction: dbTransaction });
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      // Calculate total cost
      const totalCost = this.calculateOrderCost(orderData);

      // Check if user has enough balance
      if (user.balance < totalCost) {
        throw new ApiError(400, "Insufficient balance");
      }

      // Create order
      const order = await Order.create(
        {
          userId,
          ...orderData,
          amount: totalCost,
          status: "pending",
          remainingCount: orderData.quantity,
        },
        { transaction: dbTransaction }
      );

      // Create corresponding task
      await Task.create(
        {
          userId,
          type: this.mapServiceToTaskType(orderData.service),
          platform: orderData.platform,
          targetUrl: orderData.targetUrl,
          quantity: orderData.quantity,
          remainingQuantity: orderData.quantity,
          rate: this.calculateTaskRate(orderData),
          status: "pending",
        },
        { transaction: dbTransaction }
      );

      // Create transaction record
      await Transaction.create(
        {
          userId,
          orderId: order.id,
          type: "order_payment",
          amount: -totalCost,
          status: "completed",
          method: "balance",
          details: {
            platform: orderData.platform,
            service: orderData.service,
            quantity: orderData.quantity,
          },
        },
        { transaction: dbTransaction }
      );

      // Deduct balance
      await user.decrement("balance", {
        by: totalCost,
        transaction: dbTransaction,
      });

      // Update statistics
      await this.statisticsService.calculateAndUpdateStats(userId, {
        platform: orderData.platform,
        transaction: dbTransaction,
      });

      await dbTransaction.commit();
      return order;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async createBulkOrders(userId, { orders }) {
    const dbTransaction = await sequelize.transaction();

    try {
      const user = await User.findByPk(userId, { transaction: dbTransaction });
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      // Calculate total cost for all orders
      const totalCost = orders.reduce(
        (sum, order) => sum + this.calculateOrderCost(order),
        0
      );

      // Check if user has enough balance
      if (user.balance < totalCost) {
        throw new ApiError(400, "Insufficient balance");
      }

      // Create all orders and corresponding tasks
      const createdOrders = await Promise.all(
        orders.map(async (orderData) => {
          const order = await Order.create(
            {
              userId,
              ...orderData,
              amount: this.calculateOrderCost(orderData),
              status: "pending",
              remainingCount: orderData.quantity,
            },
            { transaction: dbTransaction }
          );

          // Create corresponding task
          await Task.create(
            {
              userId,
              type: this.mapServiceToTaskType(orderData.service),
              platform: orderData.platform,
              targetUrl: orderData.targetUrl,
              quantity: orderData.quantity,
              remainingQuantity: orderData.quantity,
              rate: this.calculateTaskRate(orderData),
              status: "pending",
            },
            { transaction: dbTransaction }
          );

          return order;
        })
      );

      // Create transaction record for bulk order
      await Transaction.create(
        {
          userId,
          type: "order_payment",
          amount: -totalCost,
          status: "completed",
          method: "balance",
          details: {
            orderCount: orders.length,
            platforms: [...new Set(orders.map((o) => o.platform))],
          },
        },
        { transaction: dbTransaction }
      );

      // Deduct total balance
      await user.decrement("balance", {
        by: totalCost,
        transaction: dbTransaction,
      });

      // Update statistics for each unique platform
      const platforms = [...new Set(orders.map((order) => order.platform))];
      await Promise.all(
        platforms.map((platform) =>
          this.statisticsService.calculateAndUpdateStats(userId, {
            platform,
            transaction: dbTransaction,
          })
        )
      );

      await dbTransaction.commit();
      return {
        orders: createdOrders,
        totalCost,
      };
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  calculateOrderCost(orderData) {
    let basePrice;
    switch (orderData.service) {
      case "likes":
        basePrice = 0.5;
        break;
      case "followers":
        basePrice = 1.0;
        break;
      case "views":
        basePrice = 0.2;
        break;
      case "comments":
        basePrice = 2.0;
        break;
      case "subscribers":
        basePrice = 1.0;
        break;
      default:
        throw new ApiError(400, "Invalid service type");
    }

    let total = basePrice * orderData.quantity;

    // Apply bulk discount
    if (orderData.quantity >= 50000) {
      total *= 0.85; // 15% discount
    } else if (orderData.quantity >= 10000) {
      total *= 0.9; // 10% discount
    } else if (orderData.quantity >= 5000) {
      total *= 0.95; // 5% discount
    }

    // Add speed premium
    switch (orderData.speed) {
      case "express":
        total += 10;
        break;
      case "fast":
        total += 5;
        break;
    }

    return total;
  }

  calculateTaskRate(orderData) {
    // Calculate base rate for task doers
    let baseRate;
    switch (orderData.service) {
      case "likes":
        baseRate = 0.3; // 60% of order price
        break;
      case "followers":
        baseRate = 0.6; // 60% of order price
        break;
      case "views":
        baseRate = 0.12; // 60% of order price
        break;
      case "comments":
        baseRate = 1.2; // 60% of order price
        break;
      case "subscribers":
        baseRate = 0.6; // 60% of order price
        break;
      default:
        baseRate = 0.1;
    }

    // Apply quantity bonus
    if (orderData.quantity >= 50000) {
      baseRate *= 1.2; // 20% bonus
    } else if (orderData.quantity >= 10000) {
      baseRate *= 1.15; // 15% bonus
    } else if (orderData.quantity >= 5000) {
      baseRate *= 1.1; // 10% bonus
    }

    return baseRate;
  }

  mapServiceToTaskType(service) {
    // Map order service types to task types
    const serviceToTaskMap = {
      "likes": "like",
      "followers": "follow",
      "views": "view",
      "subscribers": "subscribe",
      "comments": "like" // Comments can be treated as likes for task purposes
    };
    
    return serviceToTaskMap[service] || "like"; // Default to "like" if not found
  }

  async repeatOrder(userId, orderId) {
    const dbTransaction = await sequelize.transaction();

    try {
      const originalOrder = await Order.findOne({
        where: { id: orderId, userId },
      });

      if (!originalOrder) {
        throw new ApiError(404, "Original order not found");
      }

      const orderData = {
        platform: originalOrder.platform,
        service: originalOrder.service,
        targetUrl: originalOrder.targetUrl,
        quantity: originalOrder.quantity,
        speed: originalOrder.speed,
      };

      const user = await User.findByPk(userId, { transaction: dbTransaction });
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      // Calculate total cost
      const totalCost = this.calculateOrderCost(orderData);

      // Check if user has enough balance
      if (user.balance < totalCost) {
        throw new ApiError(400, "Insufficient balance");
      }

      // Create new order
      const newOrder = await Order.create(
        {
          userId,
          ...orderData,
          amount: totalCost,
          status: "pending",
          remainingCount: orderData.quantity,
        },
        { transaction: dbTransaction }
      );

      // Create corresponding task
      await Task.create(
        {
          userId,
          type: this.mapServiceToTaskType(orderData.service),
          platform: orderData.platform,
          targetUrl: orderData.targetUrl,
          quantity: orderData.quantity,
          remainingQuantity: orderData.quantity,
          rate: this.calculateTaskRate(orderData),
          status: "pending",
        },
        { transaction: dbTransaction }
      );

      // Create transaction record
      await Transaction.create(
        {
          userId,
          orderId: newOrder.id,
          type: "order_payment",
          amount: -totalCost,
          status: "completed",
          method: "balance",
          details: {
            platform: orderData.platform,
            service: orderData.service,
            quantity: orderData.quantity,
            isRepeat: true,
            originalOrderId: orderId,
          },
        },
        { transaction: dbTransaction }
      );

      // Deduct balance
      await user.decrement("balance", {
        by: totalCost,
        transaction: dbTransaction,
      });

      // Update statistics
      await this.statisticsService.calculateAndUpdateStats(userId, {
        platform: orderData.platform,
        transaction: dbTransaction,
      });

      await dbTransaction.commit();
      return newOrder;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }
}
