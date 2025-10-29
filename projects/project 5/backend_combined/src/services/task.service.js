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
import { settingsService } from "./settingsService.js";

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
    // Get all user's task executions to determine their status for each task
    const userExecutions = await TaskExecution.findAll({
      where: {
        userId,
      },
      attributes: ['id', 'taskId', 'status', 'executedAt', 'completedAt'],
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'targetUrl', 'type', 'platform'],
        },
      ],
    });

    // Map of taskId -> user's execution status
    const userExecutionMap = new Map();
    userExecutions.forEach(exec => {
      userExecutionMap.set(exec.taskId, {
        status: exec.status,
        executionId: exec.id,
        executedAt: exec.executedAt,
        completedAt: exec.completedAt,
      });
    });

    // Get completed task IDs to exclude from available list
    const completedTaskIds = userExecutions
      .filter(exec => exec.status === 'completed')
      .map(exec => exec.taskId);

    // Get all completed task target URLs for duplicate detection
    const completedTaskUrls = userExecutions
      .filter(exec => exec.status === 'completed' && exec.task)
      .map(exec => ({
        url: this.normalizeTargetUrl(exec.task.targetUrl, exec.task.platform),
        type: exec.task.type,
        platform: exec.task.platform,
      }));

    const where = {
      adminStatus: "approved", // Only show admin-approved tasks
      id: { [Op.notIn]: completedTaskIds }, // Exclude completed tasks
      remainingQuantity: { [Op.gt]: 0 }, // Only show tasks with remaining quantity
    };

    // CRITICAL: Always exclude tasks created by the current user
    // This prevents task owners from seeing or claiming their own tasks
    // Handle both order-based tasks (userId: null but orderId exists) and direct tasks
    where[Op.or] = [
      { 
        userId: null, // Order-based tasks
        orderId: { [Op.ne]: null } // Ensure it's an order task
      },
      { 
        userId: { [Op.ne]: userId } // Other users' direct tasks
      }
    ];

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
      attributes: ['id', 'platform', 'type', 'targetUrl', 'rate', 'quantity', 'remainingQuantity', 'adminStatus', 'description', 'createdAt'],
      include: [
        {
          model: User,
          attributes: ["id", "username"],
        },
        {
          model: Order,
          as: "order",
          attributes: ["id", "status", "userId"],
          required: false,
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
        
        // CRITICAL: Prevent users from claiming their own order's tasks
        // If task has an order and the order belongs to the current user, exclude it
        if (taskData.order && taskData.order.userId === userId) {
          return false;
        }
        
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
        const userExecution = userExecutionMap.get(taskData.id);
        
        return {
          ...taskData,
          rate: Number(taskData.rate),
          // User-specific status: if user has an execution, use that status, otherwise "available"
          userStatus: userExecution ? userExecution.status : "available",
          userExecution: userExecution || null,
          // Keep original task status for reference
          taskStatus: taskData.status,
        };
      });
  }

  async startTask(userId, taskId) {
    const dbTransaction = await sequelize.transaction();

    try {
      // Get task and check if it exists (include Order to check status and owner)
      const task = await Task.findByPk(taskId, { 
        attributes: ['id', 'userId', 'orderId', 'platform', 'type', 'targetUrl', 'rate', 'quantity', 'remainingQuantity', 'status', 'adminStatus', 'title', 'description'],
        include: [
          {
            model: Order,
            as: "order",
            attributes: ["id", "status", "userId"],
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

      // CRITICAL: Prevent users from claiming their own order's tasks
      if (task.order && task.order.userId === userId) {
        throw new ApiError(400, "You cannot claim tasks from your own orders");
      }

      // Check if task is from a pending order - prevent claiming
      if (task.order && task.order.status === "pending") {
        throw new ApiError(400, "Cannot claim task from pending order. Order must be approved first.");
      }

      // Check max tasks per user limit from settings
      const maxTasksPerUser = await settingsService.get('tasks.maxPerUser', 10);
      const userPendingTasksCount = await TaskExecution.count({
        where: {
          userId,
          status: "pending",
        },
        transaction: dbTransaction,
      });

      if (userPendingTasksCount >= maxTasksPerUser) {
        throw new ApiError(
          400,
          `You have reached the maximum limit of ${maxTasksPerUser} concurrent tasks. Please complete some tasks before claiming new ones.`
        );
      }

      // Check if user already has a pending (uncompleted) execution for this task
      const existingPendingExecution = await TaskExecution.findOne({
        where: {
          userId,
          taskId,
          status: "pending",
        },
        transaction: dbTransaction,
      });

      if (existingPendingExecution) {
        throw new ApiError(400, "You have already started this task. Please complete it first.");
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

        // RESERVATION SYSTEM: Decrease remaining quantity when task is claimed
        // This reserves a slot for this user and prevents race conditions
        await task.decrement('remainingQuantity', {
          by: 1,
          transaction: dbTransaction,
        });

        // Set 1-hour timeout for task completion
        const now = new Date();
        const cooldownEndsAt = addHours(now, 1);

        // Claim the task by creating a task execution
        // Don't change task.userId - keep it null so others can claim it too
        const execution = await TaskExecution.create(
          {
            userId,
            taskId,
            status: "pending",
            executedAt: now,
            startedAt: now,
            cooldownEndsAt: cooldownEndsAt, // 1-hour window to complete
          },
          { transaction: dbTransaction }
        );

        await AuditLog.log(
          userId,
          "start",
          "Task",
          taskId,
          null,
          `Claimed and started task: ${task.title} (reserved slot, must complete within 1 hour)`,
          { taskType: task.type, platform: task.platform, cooldownEndsAt },
          null
        );

        await dbTransaction.commit();
        
        // Return task with execution info
        return {
          ...task.toJSON(),
          remainingQuantity: task.remainingQuantity - 1, // Return updated quantity
          execution,
        };
      }

      // For tasks with assigned userId (old flow)
      // Check if user owns the task
      if (task.userId === userId) {
        throw new ApiError(400, "Cannot execute own task");
      }

      // Check if there's remaining quantity
      if (task.remainingQuantity <= 0) {
        throw new ApiError(400, "This task has been fully completed");
      }

      // Check if task is already completed by this user
      const existingCompletedExecution = await TaskExecution.findOne({
        where: {
          userId,
          taskId,
          status: "completed",
        },
        attributes: ['id', 'status', 'completedAt'],
        transaction: dbTransaction,
      });

      if (existingCompletedExecution) {
        if (task.type === "follow" || task.type === "subscribe") {
          throw new ApiError(400, "Task already completed");
        }

        const cooldownEndsAt = addHours(
          new Date(existingCompletedExecution.completedAt),
          12
        );
        if (new Date() < cooldownEndsAt) {
          throw new ApiError(400, "Task in cooldown period");
        }
      }

      // RESERVATION SYSTEM: Decrease remaining quantity when task is claimed
      await task.decrement('remainingQuantity', {
        by: 1,
        transaction: dbTransaction,
      });

      // Set 1-hour timeout for task completion
      const now = new Date();
      const taskCooldownEndsAt = addHours(now, 1);

      // Create task execution
      const execution = await TaskExecution.create(
        {
          userId,
          taskId,
          status: "pending",
          executedAt: now,
          startedAt: now,
          cooldownEndsAt: taskCooldownEndsAt, // 1-hour window to complete
        },
        { transaction: dbTransaction }
      );

      await AuditLog.log(
        userId,
        "start",
        "Task",
        taskId,
        null,
        `Started task: ${task.title} (must complete within 1 hour)`,
        { taskType: task.type, platform: task.platform, cooldownEndsAt: taskCooldownEndsAt },
        null
      );

      await dbTransaction.commit();
      return {
        ...task.toJSON(),
        remainingQuantity: task.remainingQuantity - 1,
        execution,
      };
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
        include: [
          {
            model: Task,
            as: 'Task',
          }
        ],
        transaction: dbTransaction,
      });

      if (!execution) {
        throw new ApiError(404, "Task execution not found or already completed");
      }

      const task = execution.Task;

      // Check if task still has remaining quantity
      if (task.remainingQuantity <= 0) {
        throw new ApiError(400, "Task has been fully completed");
      }

      // Calculate earnings based on task type and rate
      const earnings = parseFloat(task.rate);

      // Update execution to completed
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

      // Decrement task's remaining quantity
      await task.decrement('remainingQuantity', {
        by: 1,
        transaction: dbTransaction,
      });

      // Increment completed quantity
      await task.increment('completedQuantity', {
        by: 1,
        transaction: dbTransaction,
      });

      // Update user balance
      await User.increment("balance", {
        by: earnings,
        where: { id: userId },
        transaction: dbTransaction,
      });

      // Create transaction record
      await Transaction.create(
        {
          userId,
          type: "task_completion",
          amount: earnings,
          status: "completed",
          method: "task",
          details: {
            taskId: task.id,
            taskType: task.type,
            platform: task.platform,
          },
        },
        { transaction: dbTransaction }
      );

      // Log the completion
      await AuditLog.log(
        userId,
        "complete",
        "Task",
        taskId,
        null,
        `Completed task: ${task.title}`,
        {
          taskType: task.type,
          platform: task.platform,
          earnings,
        },
        null
      );

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
      // Get task
      const task = await Task.findByPk(taskId, { transaction: dbTransaction });
      
      if (!task) {
        throw new ApiError(404, "Task not found");
      }

      // Get user's TaskExecution
      const execution = await TaskExecution.findOne({
        where: {
          userId,
          taskId,
          status: "pending",
        },
        transaction: dbTransaction,
      });

      if (!execution) {
        throw new ApiError(404, "You haven't started this task or it's already completed");
      }

      // Check if task has an order creator that can't claim their own tasks
      if (task.orderId) {
        const order = await Order.findByPk(task.orderId, { transaction: dbTransaction });
        if (order && order.userId === userId) {
          throw new ApiError(400, "You cannot complete tasks for your own orders");
        }
      }

      // Delete old screenshot if exists and was rejected
      if (execution.screenshotUrl && execution.screenshotStatus === 'rejected') {
        await fileService.deleteFile(execution.screenshotUrl);
      }

      // Save screenshot file
      const fileData = await fileService.saveTaskScreenshot(file, taskId);

      // Update TaskExecution with screenshot info
      await execution.update(
        {
          screenshotUrl: fileData.url,
          screenshotStatus: "pending",
          screenshotSubmittedAt: new Date(),
        },
        { transaction: dbTransaction }
      );

      // Log the submission
      await AuditLog.log(
        userId,
        "update",
        "TaskExecution",
        execution.id,
        null,
        `Submitted screenshot for task: ${task.title}`,
        {
          screenshotUrl: fileData.url,
          comment,
          fileSize: fileData.size,
          taskId,
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

  async approveTask(adminId, taskId, executionId) {
    const dbTransaction = await sequelize.transaction();

    try {
      // Get TaskExecution with row-level lock to prevent concurrent approvals
      const execution = await TaskExecution.findByPk(executionId, {
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "username", "balance"],
          },
          {
            model: Task,
            as: "task",
            include: [
              {
                model: Order,
                as: "order",
              },
            ],
          },
        ],
        lock: dbTransaction.LOCK.UPDATE,
        transaction: dbTransaction,
      });

      if (!execution) {
        await dbTransaction.rollback();
        throw new ApiError(404, "Task execution not found");
      }

      const task = execution.task;
      const userId = execution.userId;

      // Verify screenshot is pending approval
      if (execution.screenshotStatus !== "pending") {
        await dbTransaction.rollback();
        throw new ApiError(400, "Task screenshot is not pending approval");
      }

      // Calculate payout amount
      const payoutAmount = Number(task.rate);
      const orderId = task.orderId;

      // Update execution status
      await execution.update(
        {
          screenshotStatus: "approved",
          status: "completed",
          completedAt: new Date(),
          earnings: payoutAmount,
        },
        { transaction: dbTransaction }
      );

      // Decrement task remainingQuantity
      if (task.remainingQuantity > 0) {
        await task.decrement('remainingQuantity', { by: 1, transaction: dbTransaction });
        await task.increment('completedQuantity', { by: 1, transaction: dbTransaction });
      }

      // Get user's current balance before crediting
      const user = execution.User;
      const balanceBefore = Number(user.balance);
      const balanceAfter = balanceBefore + payoutAmount;

      // Create payout transaction
      await Transaction.create(
        {
          userId,
          type: "task_earning",
          amount: payoutAmount,
          status: "completed",
          method: "balance",
          reference: `TASK-${task.id.substring(0, 8).toUpperCase()}-${execution.id.substring(0, 8).toUpperCase()}`,
          description: `Earned from ${task.platform} ${task.type} task - ${task.title || task.targetUrl}`,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          processed_at: new Date(),
          processed_by: adminId, // Admin approved the task
          details: {
            taskId: task.id,
            executionId: execution.id,
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
        where: { id: userId },
        transaction: dbTransaction,
      });

      // If task is linked to an order, update order counters atomically
      if (orderId) {
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

        // Check if order is complete
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

      // Log approval
      await AuditLog.log(
        adminId,
        "approve",
        "TaskExecution",
        execution.id,
        null,
        `Approved task screenshot and processed payout of ${payoutAmount} for user ${execution.User?.username || userId}`,
        {
          payoutAmount,
          userId,
          taskId,
          orderId,
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

  async rejectTask(adminId, taskId, executionId, reason) {
    const dbTransaction = await sequelize.transaction();

    try {
      // Get TaskExecution
      const execution = await TaskExecution.findByPk(executionId, {
        include: [
          {
            model: Task,
            as: "task",
          },
        ],
        transaction: dbTransaction,
      });

      if (!execution) {
        throw new ApiError(404, "Task execution not found");
      }

      // Verify screenshot is pending approval
      if (execution.screenshotStatus !== "pending") {
        throw new ApiError(400, "Task screenshot is not pending approval");
      }

      // Update execution status (set back to pending so user can re-upload)
      await execution.update(
        {
          screenshotStatus: "rejected",
          rejectionReason: reason,
        },
        { transaction: dbTransaction }
      );

      // Log rejection
      await AuditLog.log(
        adminId,
        "reject",
        "TaskExecution",
        execution.id,
        null,
        `Rejected task screenshot: ${reason}`,
        {
          reason,
          userId: execution.userId,
          taskId,
        },
        null
      );

      await dbTransaction.commit();

      return execution;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async getTasksByStatus(userId, status, filters = {}) {
    // Handle available tasks
    if (status === "available") {
      return this.getAvailableTasks(userId, filters);
    }

    // Build TaskExecution query based on status
    const executionWhere = { userId };
    const taskWhere = {};

    switch (status) {
      case "in_progress":
        // In progress means user has started but not yet completed (pending status in TaskExecution)
        executionWhere.status = "pending";
        break;
      
      case "completed":
        // Completed means user's execution is marked as completed and approved by admin
        executionWhere.status = "completed";
        executionWhere.screenshotStatus = "approved";
        break;
      
      default:
        executionWhere.status = status;
    }

    // Add platform filter to task
    if (filters.platform) {
      taskWhere.platform = filters.platform;
    }

    // Add type filter to task
    if (filters.type) {
      taskWhere.type = filters.type;
    }

    // Query TaskExecutions with associated Tasks
    const executions = await TaskExecution.findAll({
      where: executionWhere,
      include: [
        {
          model: Task,
          as: "task",
          where: taskWhere,
          include: [
            {
              model: Order,
              as: "order",
              attributes: ["id", "userId"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: filters.limit ? parseInt(filters.limit) : undefined,
      offset: filters.page
        ? (parseInt(filters.page) - 1) * (filters.limit || 10)
        : undefined,
    });

    // Transform executions into task format that frontend expects
    return executions.map((execution) => {
      const executionData = execution.toJSON();
      const task = executionData.task;
      
      return {
        ...task,
        // Add execution-specific fields
        userStatus: executionData.status,
        userScreenshotUrl: executionData.screenshotUrl,
        userScreenshotStatus: executionData.screenshotStatus,
        screenshotSubmittedAt: executionData.screenshotSubmittedAt,
        startedAt: executionData.startedAt,
        completedAt: executionData.completedAt,
        earnings: executionData.earnings,
        proof: executionData.proof,
        rejectionReason: executionData.rejectionReason,
        // Keep task fields
        rate: Number(task.rate),
      };
    });
  }

  async getSubmittedTasksForAdmin(filters = {}) {
    const executionWhere = {
      screenshotStatus: "pending",
    };

    const taskWhere = {};

    // Add platform filter to task
    if (filters.platform) {
      taskWhere.platform = filters.platform;
    }

    // Add type filter to task
    if (filters.type) {
      taskWhere.type = filters.type;
    }

    const executions = await TaskExecution.findAll({
      where: executionWhere,
      include: [
        {
          model: Task,
          as: "task",
          where: taskWhere,
          include: [
            {
              model: Order,
              as: "order",
              attributes: ["id", "userId"],
            },
          ],
        },
        {
          model: User,
          as: "User",
          attributes: ["id", "username", "email"],
        },
      ],
      order: [["screenshotSubmittedAt", "ASC"]], // Oldest first (FIFO)
      limit: filters.limit ? parseInt(filters.limit) : undefined,
      offset: filters.page
        ? (parseInt(filters.page) - 1) * (filters.limit || 10)
        : undefined,
    });

    return executions.map((execution) => {
      const executionData = execution.toJSON();
      const task = executionData.task;
      
      return {
        ...task,
        executionId: executionData.id,
        userId: executionData.userId,
        user: executionData.User,
        screenshotUrl: executionData.screenshotUrl,
        screenshotStatus: executionData.screenshotStatus,
        screenshotSubmittedAt: executionData.screenshotSubmittedAt,
        startedAt: executionData.startedAt,
        proof: executionData.proof,
        rate: Number(task.rate),
      };
    });
  }
}
