import { TaskService } from "../services/task.service.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";

const taskService = new TaskService();

export class TaskController {
  // Get available tasks
  getAvailableTasks = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { platform, type, page = 1, limit = 10 } = req.query;

    const tasks = await taskService.getAvailableTasks(userId, {
      platform,
      type,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json(tasks);
  });

  // Start task
  startTask = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const taskId = req.params.id;

    const execution = await taskService.startTask(userId, taskId);
    res.json(execution);
  });

  // Complete task
  completeTask = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { proof } = req.body;

    const execution = await taskService.completeTask(userId, taskId, proof);
    res.json(execution);
  });

  // Get task details
  getTaskDetails = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const taskId = req.params.id;

    const task = await taskService.getTaskDetails(userId, taskId);
    res.json(task);
  });
}
