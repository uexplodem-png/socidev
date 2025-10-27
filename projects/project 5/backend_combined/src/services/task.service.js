import { Op } from "sequelize";
import Task from "../models/Task.js";
import TaskExecution from "../models/TaskExecution.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Transaction from "../models/Transaction.js";
import AuditLog from "../models/AuditLog.js";
import { ApiError } from "../utils/ApiError.js";
import { sequelize } from "../config/database.js";
import { addHours } from "date-fns";
import fileService from "./file.service.js";

export class TaskService {
  /**
   * Normalize target URL to prevent duplicate task executions
   * Examples:
   * - https://instagram.com/socidev -> socidev
   * - instagram.com/socidev -> socidev
   * - @socidev -> socidev
   * - socidev -> socidev
   */
  normalizeTargetUrl(url, platform) {
    if (!url) return null;

    let normalized = url.trim().toLowerCase();

    // Remove protocol
    normalized = normalized.replace(/^https?:\/\//, '');
    normalized = normalized.replace(/^www\./, '');

    // Platform-specific normalization
    switch (platform?.toLowerCase()) {
      case 'instagram':
        normalized = normalized.replace(/^(instagram\.com\/|ig\.me\/)/, '');
        normalized = normalized.replace(/^@/, '');
        normalized = normalized.replace(/\/$/, ''); // Remove trailing slash
        break;
      case 'youtube':
        normalized = normalized.replace(/^(youtube\.com\/(user\/|c\/|channel\/|@)?|youtu\.be\/)/, '');
        normalized = normalized.replace(/^@/, '');
        normalized = normalized.replace(/\/$/, '');
        break;
      case 'twitter':
      case 'x':
        normalized = normalized.replace(/^(twitter\.com\/|x\.com\/)/, '');
        normalized = normalized.replace(/^@/, '');
        normalized = normalized.replace(/\/$/, '');
        break;
      case 'tiktok':
        normalized = normalized.replace(/^tiktok\.com\/@?/, '');
        normalized = normalized.replace(/^@/, '');
        normalized = normalized.replace(/\/$/, '');
        break;
      case 'facebook':
        normalized = normalized.replace(/^(facebook\.com\/|fb\.com\/)/, '');
        normalized = normalized.replace(/\/$/, '');
        break;
      default:
        // Generic normalization
        normalized = normalized.split('/')[0]; // Take first part after domain
        normalized = normalized.replace(/^@/, '');
    }

    // Remove query parameters and fragments
    normalized = normalized.split('?')[0];
    normalized = normalized.split('#')[0];

    return normalized;
  }

  async hasUserCompletedSimilarTask(userId, taskType, platform, targetUrl) {
    const normalizedUrl = this.normalizeTargetUrl(targetUrl, platform);

    if (!normalizedUrl) return false;

    // Get all completed tasks by this user for the same platform and task type
    const completedTasks = await TaskExecution.findAll({
      where: {
        userId,
        status: 'completed',
      },
      include: [
        {
          model: Task,
          as: 'task',
          where: {
            type: taskType,
            platform,
          },
          attributes: ['id', 'targetUrl', 'type', 'platform'],
        },
      ],
    });

    // Check if any completed task has the same normalized URL
    for (const execution of completedTasks) {
      const completedNormalizedUrl = this.normalizeTargetUrl(
        execution.task.targetUrl,
        execution.task.platform
      );

      if (completedNormalizedUrl === normalizedUrl) {
        return true;
      }
    }

    return false;
  }

  async getAvailableTasks(userId, filters = {}) {
    // First, get all task IDs that the user has already executed
    const userExecutions = await TaskExecution.findAll({
      where: {
        userId,
        [Op.or]: [{ status: "completed" }, { status: "pending" }],
      },
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'targetUrl', 'type', 'platform'],
        },
      ],
    });

    const executedTaskIds = userExecutions.map(execution => execution.taskId);

    // Get all completed task target URLs for duplicate detection
    const completedTaskUrls = userExecutions
      .filter(exec => exec.status === 'completed' && exec.task)
      .map(exec => ({
        url: this.normalizeTargetUrl(exec.task.targetUrl, exec.task.platform),
        type: exec.task.type,
        platform: exec.task.platform,
      }));

    const where = {
      // Show tasks that are either:
      // 1. Created from orders (userId is null) - available for all task doers
      // 2. Created by other users (userId not equal to current user)
      [Op.or]: [
        { userId: null }, // Tasks from orders
        { userId: { [Op.ne]: userId } } // Other users' tasks
      ],
      status: { [Op.in]: ["pending", "processing"] },
      adminStatus: "approved", // Only show admin-approved tasks
      id: { [Op.notIn]: executedTaskIds }, // Exclude tasks user has already executed
    };

    // Add platform filter
    if (filters.platform) {
      where.platform = filters.platform;
    }

    // Add type filter
    if (filters.type) {
      where.type = filters.type;
    }

    // Add search filter if provided
    if (filters.search) {
      where[Op.or] = [
        { targetUrl: { [Op.like]: `%${filters.search}%` } },
        { "$User.username$": { [Op.like]: `%${filters.search}%` } },
      ];
    }

    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ["username"],
        },
        {
          model: Order,
          as: "order", // Use the alias defined in the association
          attributes: ["id", "status"],
          required: false, // LEFT JOIN - include tasks without orders too
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: filters.limit ? parseInt(filters.limit) : undefined,
      offset: filters.page
        ? (parseInt(filters.page) - 1) * (filters.limit || 10)
        : undefined,
    });

    // Filter out tasks from pending orders and tasks with duplicate URLs
    return tasks
      .filter((task) => {
        const taskData = task.toJSON();
        
        // If task has an order, only show if order status is NOT pending
        if (taskData.order && taskData.order.status === "pending") {
          return false;
        }

        // Check if user has already completed a task for the same normalized URL
        const normalizedTaskUrl = this.normalizeTargetUrl(taskData.targetUrl, taskData.platform);
        const hasDuplicate = completedTaskUrls.some(
          completed => 
            completed.url === normalizedTaskUrl &&
            completed.type === taskData.type &&
            completed.platform === taskData.platform
        );

        if (hasDuplicate) {
          return false; // Don't show this task
        }

        return true;
      })
      .map((task) => {
        const taskData = task.toJSON();
        return {
          ...taskData,
          rate: Number(taskData.rate),
          status: "available",
        };
      });
  }

  async startTask(userId, taskId) {
    const dbTransaction = await sequelize.transaction();

    try {
      // Get task and check if it exists (include Order to check status)
      const task = await Task.findByPk(taskId, { 
        include: [
          {
            model: Order,
            as: "order", // Use the alias defined in the association
            attributes: ["id", "status"],
          },
        ],
        transaction: dbTransaction 
      });
      
      if (!task) {
        throw new ApiError(404, "Task not found");
      }

      // Check if task is admin approved
      if (task.adminStatus !== "approved") {
        throw new ApiError(400, "Task is not approved by admin");
      }

      // Check if task is from a pending order - prevent claiming
      if (task.order && task.order.status === "pending") {
        throw new ApiError(400, "Cannot claim task from pending order. Order must be approved first.");
      }

      // Check if user has already completed a similar task (same target URL)
      // This prevents users from doing duplicate tasks like following the same account twice
      const hasCompletedSimilar = await this.hasUserCompletedSimilarTask(
        userId,
        task.type,
        task.platform,
        task.targetUrl
      );

      if (hasCompletedSimilar) {
        throw new ApiError(
          400,
          `You have already completed a ${task.type} task for this ${task.platform} account. You cannot do this task again.`
        );
      }

      // For tasks from orders (userId is null), claim the task
      if (task.userId === null) {
        // Check if task is still available for claiming
        if (task.status !== "pending") {
          throw new ApiError(400, "Task is no longer available");
        }

        // Check if there's remaining quantity
        if (task.remainingQuantity <= 0) {
          throw new ApiError(400, "This task has been fully completed");
        }

        // Claim the task by creating a task execution
        // Don't change task.userId - keep it null so others can claim it too
        const execution = await TaskExecution.create(
          {
            userId,
            taskId,
            status: "pending",
            executedAt: new Date(),
          },
          { transaction: dbTransaction }
        );

        await AuditLog.log(
          userId,
          "start",
          "Task",
          taskId,
          null,
          `Claimed and started task: ${task.title}`,
          { taskType: task.type, platform: task.platform },
          null
        );

        await dbTransaction.commit();
        
        // Return task with execution info
        return {
          ...task.toJSON(),
          execution,
        };
      }

      // For tasks with assigned userId (old flow)
      // Check if user owns the task
      if (task.userId === userId) {
        throw new ApiError(400, "Cannot execute own task");
      }

      // Check if task is already completed by this user
      const existingExecution = await TaskExecution.findOne({
        where: {
          userId,
          taskId,
          status: "completed",
        },
        transaction: dbTransaction,
      });

      if (existingExecution) {
        if (task.type === "follow" || task.type === "subscribe") {
          throw new ApiError(400, "Task already completed");
        }

        const cooldownEndsAt = addHours(
          new Date(existingExecution.completedAt),
          12
        );
        if (new Date() < cooldownEndsAt) {
          throw new ApiError(400, "Task in cooldown period");
        }
      }

      // Create task execution
      const execution = await TaskExecution.create(
        {
          userId,
          taskId,
          status: "pending",
          executedAt: new Date(),
        },
        { transaction: dbTransaction }
      );

      await dbTransaction.commit();
      return execution;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async completeTask(userId, taskId, proof = {}) {
    const dbTransaction = await sequelize.transaction();

    try {
      // Get task execution
      const execution = await TaskExecution.findOne({
        where: {
          userId,
          taskId,
          status: "pending",
        },
        include: [Task],
        transaction: dbTransaction,
      });

      if (!execution) {
        throw new ApiError(404, "Task execution not found");
      }

      // Calculate earnings based on task type and rate
      const earnings = execution.Task.rate;

      // Update execution
      await execution.update(
        {
          status: "completed",
          completedAt: new Date(),
          cooldownEndsAt: addHours(new Date(), 12),
          earnings,
          proof,
        },
        { transaction: dbTransaction }
      );

      // Update user balance
      await User.increment("balance", {
        by: earnings,
        where: { id: userId },
        transaction: dbTransaction,
      });

      // Update task progress
      await execution.Task.increment("completedCount", {
        by: 1,
        transaction: dbTransaction,
      });

      await dbTransaction.commit();
      return execution;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async getTaskDetails(userId, taskId) {
    const task = await Task.findOne({
      where: { id: taskId },
      include: [
        {
          model: TaskExecution,
          where: { userId },
          required: false,
        },
      ],
    });

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    // Ensure rate is converted to number
    const taskData = task.toJSON();
    return {
      ...taskData,
      rate: Number(taskData.rate),
    };
  }

  async submitScreenshot(userId, taskId, file, comment = null) {
    const dbTransaction = await sequelize.transaction();

    try {
      // Get task and verify ownership
      const task = await Task.findByPk(taskId, { transaction: dbTransaction });
      
      if (!task) {
        throw new ApiError(404, "Task not found");
      }

      // Verify user owns this task
      if (task.userId !== userId) {
        throw new ApiError(403, "You can only submit screenshots for your own tasks");
      }

      // Verify task is in correct status
      if (!["in_progress", "rejected_by_admin"].includes(task.status)) {
        throw new ApiError(400, "Task must be in progress to submit screenshot");
      }

      // Check if task has an order creator that can't claim their own tasks
      if (task.orderId) {
        const order = await Order.findByPk(task.orderId, { transaction: dbTransaction });
        if (order && order.userId === userId) {
          throw new ApiError(400, "You cannot complete tasks for your own orders");
        }
      }

      // Delete old screenshot if exists and was rejected
      if (task.screenshotUrl && task.screenshotStatus === 'rejected') {
        await fileService.deleteFile(task.screenshotUrl);
      }

      // Save screenshot file
      const fileData = await fileService.saveTaskScreenshot(file, taskId);

      // Update task with screenshot info
      await task.update(
        {
          screenshotUrl: fileData.url,
          screenshotStatus: "pending",
          screenshotSubmittedAt: new Date(),
          status: "submitted_for_approval",
        },
        { transaction: dbTransaction }
      );

      // Log the submission
      await AuditLog.log(
        userId,
        "update",
        "Task",
        taskId,
        null,
        `Submitted screenshot for task: ${task.title}`,
        {
          screenshotUrl: fileData.url,
          comment,
          fileSize: fileData.size,
        },
        null
      );

      await dbTransaction.commit();

      return {
        success: true,
        screenshotStatus: "pending",
        screenshotUrl: fileData.url,
        task,
      };
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async approveTask(adminId, taskId) {
    const dbTransaction = await sequelize.transaction();

    try {
      // Get task with row-level lock to prevent concurrent approvals
      const task = await Task.findByPk(taskId, {
        include: [
          {
            model: User,
            attributes: ["id", "username", "balance"],
          },
        ],
        lock: dbTransaction.LOCK.UPDATE,
        transaction: dbTransaction,
      });

      if (!task) {
        await dbTransaction.rollback();
        throw new ApiError(404, "Task not found");
      }

      // Idempotency check: if already processed, return success without double-paying
      if (task.payoutProcessed) {
        await dbTransaction.commit();
        return task;
      }

      // Verify screenshot is pending approval
      if (task.screenshotStatus !== "pending") {
        await dbTransaction.rollback();
        throw new ApiError(400, "Task screenshot is not pending approval");
      }

      // Verify task has a doer
      if (!task.userId) {
        await dbTransaction.rollback();
        throw new ApiError(400, "Task has no assigned user");
      }

      // Calculate payout amount
      const payoutAmount = Number(task.rate);
      const orderId = task.orderId;

      // Update task status
      await task.update(
        {
          screenshotStatus: "approved",
          status: "completed",
          completedAt: new Date(),
          payoutProcessed: true,
          adminReviewedBy: adminId,
          adminReviewedAt: new Date(),
        },
        { transaction: dbTransaction }
      );

      // Create payout transaction
      await Transaction.create(
        {
          userId: task.userId,
          type: "task_earning",
          amount: payoutAmount,
          status: "completed",
          method: "balance",
          details: {
            taskId: task.id,
            taskTitle: task.title,
            platform: task.platform,
            type: task.type,
            approvedBy: adminId,
          },
        },
        { transaction: dbTransaction }
      );

      // Credit user balance
      await User.increment("balance", {
        by: payoutAmount,
        where: { id: task.userId },
        transaction: dbTransaction,
      });

      // If task is linked to an order, update order counters atomically WITHOUT locking
      // This reduces lock contention when multiple tasks are approved simultaneously
      if (orderId) {
        // Use atomic increment/decrement operations - no explicit lock needed
        await Order.increment("completedCount", {
          by: 1,
          where: { id: orderId },
          transaction: dbTransaction,
        });

        await Order.decrement("remainingCount", {
          by: 1,
          where: { id: orderId },
          transaction: dbTransaction,
        });

        // Check if order is complete in a separate query (may have slight delay but avoids deadlock)
        const updatedOrder = await Order.findByPk(orderId, {
          attributes: ["id", "remainingCount", "status"],
          transaction: dbTransaction,
        });

        // Update order status if fully completed
        if (updatedOrder && updatedOrder.remainingCount <= 0 && updatedOrder.status !== "completed") {
          await Order.update(
            {
              status: "completed",
              completedAt: new Date(),
            },
            {
              where: { id: orderId },
              transaction: dbTransaction,
            }
          );
        }
      }

      // Log approval with order details
      await AuditLog.log(
        adminId,
        "approve",
        "Task",
        taskId,
        null,
        `Approved task screenshot and processed payout of ${payoutAmount} for user ${task.User?.username || task.userId}`,
        {
          payoutAmount,
          userId: task.userId,
          orderId: task.orderId,
        },
        null
      );

      await dbTransaction.commit();

      return task;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async rejectTask(adminId, taskId, reason) {
    const dbTransaction = await sequelize.transaction();

    try {
      // Get task
      const task = await Task.findByPk(taskId, { transaction: dbTransaction });

      if (!task) {
        throw new ApiError(404, "Task not found");
      }

      // Verify screenshot is pending approval
      if (task.screenshotStatus !== "pending") {
        throw new ApiError(400, "Task screenshot is not pending approval");
      }

      // Update task status
      await task.update(
        {
          screenshotStatus: "rejected",
          status: "rejected_by_admin",
          rejectionReason: reason,
          adminReviewedBy: adminId,
          adminReviewedAt: new Date(),
        },
        { transaction: dbTransaction }
      );

      // Log rejection
      await AuditLog.log(
        adminId,
        "reject",
        "Task",
        taskId,
        null,
        `Rejected task screenshot: ${reason}`,
        {
          reason,
          userId: task.userId,
        },
        null
      );

      await dbTransaction.commit();

      return task;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async getTasksByStatus(userId, status, filters = {}) {
    const where = { userId };

    // Map status to task statuses
    switch (status) {
      case "available":
        // This is handled by getAvailableTasks
        return this.getAvailableTasks(userId, filters);
      
      case "in_progress":
        where.status = {
          [Op.in]: ["in_progress", "submitted_for_approval", "rejected_by_admin"],
        };
        break;
      
      case "completed":
        where.status = "completed";
        where.screenshotStatus = "approved";
        break;
      
      default:
        where.status = status;
    }

    // Add platform filter
    if (filters.platform) {
      where.platform = filters.platform;
    }

    // Add type filter
    if (filters.type) {
      where.type = filters.type;
    }

    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ["username"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: filters.limit ? parseInt(filters.limit) : undefined,
      offset: filters.page
        ? (parseInt(filters.page) - 1) * (filters.limit || 10)
        : undefined,
    });

    return tasks.map((task) => {
      const taskData = task.toJSON();
      return {
        ...taskData,
        rate: Number(taskData.rate),
      };
    });
  }

  async getSubmittedTasksForAdmin(filters = {}) {
    const where = {
      screenshotStatus: "pending",
      status: "submitted_for_approval",
    };

    // Add platform filter
    if (filters.platform) {
      where.platform = filters.platform;
    }

    // Add type filter
    if (filters.type) {
      where.type = filters.type;
    }

    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email"],
        },
      ],
      order: [["screenshotSubmittedAt", "ASC"]], // Oldest first (FIFO)
      limit: filters.limit ? parseInt(filters.limit) : undefined,
      offset: filters.page
        ? (parseInt(filters.page) - 1) * (filters.limit || 10)
        : undefined,
    });

    return tasks.map((task) => {
      const taskData = task.toJSON();
      return {
        ...taskData,
        rate: Number(taskData.rate),
      };
    });
  }
}
