import { TaskService } from "../services/task.service.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";
import multer from "multer";

const taskService = new TaskService();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid file type. Only JPEG, PNG, and WebP are allowed'));
    }
  },
});

export const uploadScreenshot = upload.single('screenshot');

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

  // Submit screenshot for task
  submitScreenshot = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const taskId = req.params.id;
    const file = req.file;
    const { comment } = req.body;

    if (!file) {
      throw new ApiError(400, "Screenshot file is required");
    }

    const result = await taskService.submitScreenshot(userId, taskId, file, comment);
    res.json(result);
  });

  // Get tasks by status (for task doer's tabs)
  getTasksByStatus = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { status } = req.params;
    const { platform, type, page = 1, limit = 10 } = req.query;

    const tasks = await taskService.getTasksByStatus(userId, status, {
      platform,
      type,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json(tasks);
  });

  // Admin: Get submitted tasks for review
  getSubmittedTasks = catchAsync(async (req, res) => {
    // Check if user is admin
    if (!["admin", "super_admin", "moderator"].includes(req.user.role)) {
      throw new ApiError(403, "Access denied. Admin privileges required.");
    }

    const { platform, type, page = 1, limit = 20 } = req.query;

    const tasks = await taskService.getSubmittedTasksForAdmin({
      platform,
      type,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json(tasks);
  });

  // Admin: Approve task
  approveTask = catchAsync(async (req, res) => {
    // Check if user is admin
    if (!["admin", "super_admin", "moderator"].includes(req.user.role)) {
      throw new ApiError(403, "Access denied. Admin privileges required.");
    }

    const adminId = req.user.id;
    const taskId = req.params.id;
    const { executionId } = req.body;

    if (!executionId) {
      throw new ApiError(400, "executionId is required");
    }

    const task = await taskService.approveTask(adminId, taskId, executionId);
    res.json({
      success: true,
      message: "Task approved and payout processed",
      task,
    });
  });

  // Admin: Reject task
  rejectTask = catchAsync(async (req, res) => {
    // Check if user is admin
    if (!["admin", "super_admin", "moderator"].includes(req.user.role)) {
      throw new ApiError(403, "Access denied. Admin privileges required.");
    }

    const adminId = req.user.id;
    const taskId = req.params.id;
    const { reason, executionId } = req.body;

    if (!reason) {
      throw new ApiError(400, "Rejection reason is required");
    }

    if (!executionId) {
      throw new ApiError(400, "executionId is required");
    }

    const task = await taskService.rejectTask(adminId, taskId, executionId, reason);
    res.json({
      success: true,
      message: "Task rejected",
      task,
    });
  });
}
