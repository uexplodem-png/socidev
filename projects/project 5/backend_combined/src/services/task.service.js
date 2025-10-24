import { Op } from "sequelize";
import Task from "../models/Task.js";
import TaskExecution from "../models/TaskExecution.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import sequelize from "../config/database.js";
import { addHours } from "date-fns";

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
      userId: { [Op.ne]: userId }, // Exclude user's own tasks
      status: { [Op.in]: ["pending", "processing"] },
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
}
