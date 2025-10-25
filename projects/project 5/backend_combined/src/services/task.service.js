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
  async getAvailableTasks(userId, filters = {}) {
    // First, get all task IDs that the user has already executed
    const userExecutions = await TaskExecution.findAll({
      where: {
        userId,
        [Op.or]: [{ status: "completed" }, { status: "pending" }],
      },
      attributes: ["taskId"],
    });

    const executedTaskIds = userExecutions.map(execution => execution.taskId);

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
      ],
      order: [["createdAt", "DESC"]],
      limit: filters.limit ? parseInt(filters.limit) : undefined,
      offset: filters.page
        ? (parseInt(filters.page) - 1) * (filters.limit || 10)
        : undefined,
    });

    // Transform tasks to available status (since we've already filtered out executed tasks)
    // Ensure rate is converted to number
    return tasks.map((task) => {
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
      // Get task and check if it exists
      const task = await Task.findByPk(taskId, { transaction: dbTransaction });
      if (!task) {
        throw new ApiError(404, "Task not found");
      }

      // Check if task is admin approved
      if (task.adminStatus !== "approved") {
        throw new ApiError(400, "Task is not approved by admin");
      }

      // For tasks from orders (userId is null), claim the task
      if (task.userId === null) {
        // Check if task is still available for claiming
        if (task.status !== "pending") {
          throw new ApiError(400, "Task is no longer available");
        }

        // Claim the task
        await task.update(
          {
            userId,
            status: "in_progress",
            startedAt: new Date(),
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
        return task;
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
      // Get task
      const task = await Task.findByPk(taskId, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "username", "balance"],
          },
        ],
        transaction: dbTransaction,
      });

      if (!task) {
        throw new ApiError(404, "Task not found");
      }

      // Verify screenshot is pending approval
      if (task.screenshotStatus !== "pending") {
        throw new ApiError(400, "Task screenshot is not pending approval");
      }

      // Verify payout not already processed
      if (task.payoutProcessed) {
        throw new ApiError(400, "Payout already processed for this task");
      }

      // Verify task has a doer
      if (!task.userId) {
        throw new ApiError(400, "Task has no assigned user");
      }

      // Calculate payout amount
      const payoutAmount = Number(task.rate);

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
          type: "task_payout",
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

      // If task is linked to an order, decrement order's remaining count
      if (task.orderId) {
        const order = await Order.findByPk(task.orderId, { transaction: dbTransaction });
        if (order && order.remainingCount > 0) {
          await order.decrement("remainingCount", {
            by: 1,
            transaction: dbTransaction,
          });

          // Update order status if fully completed
          if (order.remainingCount - 1 <= 0) {
            await order.update(
              { status: "completed" },
              { transaction: dbTransaction }
            );
          }
        }

        // Decrement task remaining quantity
        if (task.remainingQuantity > 0) {
          await task.decrement("remainingQuantity", {
            by: 1,
            transaction: dbTransaction,
          });
        }
      }

      // Log approval
      await AuditLog.log(
        adminId,
        "approve",
        "Task",
        taskId,
        null,
        `Approved task screenshot and processed payout of ${payoutAmount} for user ${task.user.username}`,
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
