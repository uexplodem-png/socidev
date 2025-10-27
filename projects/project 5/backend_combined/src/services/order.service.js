import { Op } from "sequelize";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Transaction from "../models/Transaction.js";
import Service from "../models/Service.js";
import AuditLog from "../models/AuditLog.js";
import { ApiError } from "../utils/ApiError.js";
import { sequelize } from "../config/database.js";
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
          as: 'user',
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
          as: 'user',
          attributes: ["id", "username"],
        },
      ],
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return order;
  }

  async getOrderStatsById(userId, orderId) {
    const order = await Order.findOne({
      where: { id: orderId, userId },
      attributes: ["id", "quantity", "completedCount", "remainingCount", "status", "createdAt", "completedAt"],
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return {
      id: order.id,
      quantity: order.quantity,
      completedCount: order.completedCount,
      remainingCount: order.remainingCount,
      status: order.status,
      progressPercentage: order.quantity > 0 ? Math.round((order.completedCount / order.quantity) * 100) : 0,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
    };
  }

  async createOrder(userId, orderData) {
    const dbTransaction = await sequelize.transaction();

    try {
      const user = await User.findByPk(userId, { transaction: dbTransaction });
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      // Fetch service to get service name
      const service = await Service.findByPk(orderData.service, { transaction: dbTransaction });
      if (!service) {
        throw new ApiError(400, "Invalid service");
      }

      // Calculate total cost
      const totalCost = await this.calculateOrderCost(orderData);

      // Check if user has enough balance
      if (user.balance < totalCost) {
        throw new ApiError(400, "Insufficient balance");
      }

      // Create order with service name instead of service ID
      const order = await Order.create(
        {
          userId,
          platform: orderData.platform,
          service: service.name, // Store service name instead of ID
          targetUrl: orderData.targetUrl,
          quantity: orderData.quantity,
          speed: orderData.speed,
          amount: totalCost,
          status: "pending",
          remainingCount: orderData.quantity,
          completedCount: 0,
        },
        { transaction: dbTransaction }
      );

      // Tasks will be created when admin approves the order (changes status to 'processing')
      // No need to create tasks here anymore

      // Get user's balance before transaction
      const balanceBefore = Number(user.balance);
      const balanceAfter = balanceBefore - totalCost;

      // Create transaction record
      await Transaction.create(
        {
          userId,
          orderId: order.id,
          type: "order_payment",
          amount: -totalCost,
          status: "completed",
          method: "balance",
          reference: `ORDER-${order.id.substring(0, 8).toUpperCase()}`,
          description: `Payment for ${service.name} order - ${orderData.quantity} ${orderData.platform} ${service.name}`,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          processed_at: new Date(),
          processed_by: userId, // User processed their own order
          details: {
            platform: orderData.platform,
            service: service.name,
            quantity: orderData.quantity,
            targetUrl: orderData.targetUrl,
          },
        },
        { transaction: dbTransaction }
      );

      // Add to audit log
      await AuditLog.log(
        userId,
        "create",
        "Order",
        order.id,
        null,
        `Created order for ${service.name} service with quantity ${orderData.quantity} on ${orderData.platform} platform`,
        {
          platform: orderData.platform,
          service: service.name,
          quantity: orderData.quantity,
          targetUrl: orderData.targetUrl,
          speed: orderData.speed,
          amount: totalCost,
        },
        null
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

      // Fetch all services to get service names
      const services = await Service.findAll({
        where: {
          id: orders.map((o) => o.service),
        },
        transaction: dbTransaction,
      });

      const serviceMap = services.reduce((map, svc) => {
        map[svc.id] = svc.name;
        return map;
      }, {});

      // Validate all services exist
      for (const order of orders) {
        if (!serviceMap[order.service]) {
          throw new ApiError(400, `Invalid service: ${order.service}`);
        }
      }

      // Calculate total cost for all orders
      const orderCosts = await Promise.all(
        orders.map((order) => this.calculateOrderCost(order))
      );
      const totalCost = orderCosts.reduce((sum, cost) => sum + cost, 0);

      // Check if user has enough balance
      if (user.balance < totalCost) {
        throw new ApiError(400, "Insufficient balance");
      }

      // Create all orders and corresponding tasks
      const createdOrders = await Promise.all(
        orders.map(async (orderData, index) => {
          const amount = orderCosts[index];
          const serviceName = serviceMap[orderData.service];

          const order = await Order.create(
            {
              userId,
              platform: orderData.platform,
              service: serviceName, // Store service name instead of ID
              targetUrl: orderData.targetUrl,
              quantity: orderData.quantity,
              speed: orderData.speed,
              amount,
              status: "pending",
              remainingCount: orderData.quantity,
              completedCount: 0,
            },
            { transaction: dbTransaction }
          );

          // Create N individual tasks (one per required action)
          const taskRate = this.calculateTaskRate(orderData);
          const taskType = this.mapServiceToTaskType(serviceName);
          const batchSize = 500;
          // Tasks will be created when admin approves the order (changes status to 'processing')
          // No need to create tasks here anymore

          // Add audit log for each order
          await AuditLog.log(
            userId,
            "create",
            "Order",
            order.id,
            null,
            `Created order for ${serviceName} service with quantity ${orderData.quantity} on ${orderData.platform} platform (bulk order)`,
            {
              platform: orderData.platform,
              service: serviceName,
              quantity: orderData.quantity,
              targetUrl: orderData.targetUrl,
              speed: orderData.speed,
              amount,
              isBulk: true,
            },
            null
          );

          return order;
        })
      );

      // Get user's balance before transaction
      const balanceBefore = Number(user.balance);
      const balanceAfter = balanceBefore - totalCost;

      // Create transaction record for bulk order
      await Transaction.create(
        {
          userId,
          type: "order_payment",
          amount: -totalCost,
          status: "completed",
          method: "balance",
          reference: `BULK-${createdOrders[0].id.substring(0, 8).toUpperCase()}`,
          description: `Bulk payment for ${orders.length} orders across ${[...new Set(orders.map((o) => o.platform))].join(', ')} platforms`,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          processed_at: new Date(),
          processed_by: userId, // User processed their own bulk order
          details: {
            orderCount: orders.length,
            platforms: [...new Set(orders.map((o) => o.platform))],
            orderIds: createdOrders.map(o => o.id),
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

  async calculateOrderCost(orderData) {
    // Fetch the service - try by ID first, then by name if it's a UUID
    let service = await Service.findByPk(orderData.service);
    
    // If not found by ID, try to find by name (for repeat orders that store service name)
    if (!service && typeof orderData.service === 'string') {
      service = await Service.findOne({
        where: { name: orderData.service },
      });
    }

    if (!service) {
      throw new ApiError(400, "Invalid service");
    }

    let basePrice = parseFloat(service.pricePerUnit);
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
      const totalCost = await this.calculateOrderCost(orderData);

      // Check if user has enough balance
      if (user.balance < totalCost) {
        throw new ApiError(400, "Insufficient balance");
      }

      // Create new order
      const newOrder = await Order.create(
        {
          userId,
          platform: orderData.platform,
          service: orderData.service, // Already stored as service name from original order
          targetUrl: orderData.targetUrl,
          quantity: orderData.quantity,
          speed: orderData.speed,
          amount: totalCost,
          status: "pending",
          remainingCount: orderData.quantity,
          completedCount: 0,
        },
        { transaction: dbTransaction }
      );

      // Create N individual tasks (one per required action)
      const taskRate = this.calculateTaskRate(orderData);
      const taskType = this.mapServiceToTaskType(orderData.service);
      const batchSize = 500;
      const tasksToCreate = [];

      for (let i = 0; i < orderData.quantity; i++) {
        tasksToCreate.push({
          orderId: newOrder.id,
          userId: null,
          title: `${orderData.service} - ${orderData.targetUrl}`,
          description: `Complete ${orderData.service} task for ${orderData.targetUrl}`,
          type: taskType,
          platform: orderData.platform,
          targetUrl: orderData.targetUrl,
          quantity: 1,
          remainingQuantity: 1,
          completedQuantity: 0,
          rate: taskRate,
          status: "pending",
          adminStatus: "approved",
          lastUpdatedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        if (tasksToCreate.length === batchSize) {
          await Task.bulkCreate(tasksToCreate, { transaction: dbTransaction });
          tasksToCreate.length = 0;
        }
      }

      if (tasksToCreate.length > 0) {
        await Task.bulkCreate(tasksToCreate, { transaction: dbTransaction });
      }

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

      // Add to audit log
      await AuditLog.log(
        userId,
        "create",
        "Order",
        newOrder.id,
        null,
        `Repeated order for ${orderData.service} service with quantity ${orderData.quantity} on ${orderData.platform} platform (original: ${orderId})`,
        {
          platform: orderData.platform,
          service: orderData.service,
          quantity: orderData.quantity,
          targetUrl: orderData.targetUrl,
          speed: orderData.speed,
          amount: totalCost,
          isRepeat: true,
          originalOrderId: orderId,
        },
        null
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
