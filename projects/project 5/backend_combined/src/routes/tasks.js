import express from "express";
import { TaskController, uploadScreenshot } from "../controllers/task.controller.js";
import { authenticateToken as auth } from "../middleware/auth.js";
import { validateTaskCompletion } from "../validators/task.validator.js";
import { rateLimiter } from "../middleware/rate-limiter.js";
import { enforceFeatureFlag } from "../middleware/settingsEnforcement.js";

const router = express.Router();
const taskController = new TaskController();

// Apply feature flag check to all task routes
router.use(enforceFeatureFlag('features.tasks.moduleEnabled', 'Tasks module is currently disabled'));

// Get available tasks
router.get(
  "/available",
  auth,
  rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
  }),
  taskController.getAvailableTasks
);

// Get tasks by status (for tabs: in_progress, completed, etc.)
router.get(
  "/status/:status",
  auth,
  rateLimiter({
    windowMs: 60 * 1000,
    max: 30,
  }),
  taskController.getTasksByStatus
);

// Start/claim task
router.post(
  "/:id/start",
  auth,
  rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 task starts per minute
  }),
  taskController.startTask
);

// Submit screenshot for task
router.post(
  "/:id/submit-screenshot",
  auth,
  uploadScreenshot,
  rateLimiter({
    windowMs: 60 * 1000,
    max: 5, // 5 screenshot uploads per minute
  }),
  taskController.submitScreenshot
);

// Complete task (old flow - keeping for backward compatibility)
router.post(
  "/:id/complete",
  auth,
  validateTaskCompletion,
  rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 task completions per minute
  }),
  taskController.completeTask
);

// Admin routes for task management
router.get(
  "/admin/submitted",
  auth,
  rateLimiter({
    windowMs: 60 * 1000,
    max: 60,
  }),
  taskController.getSubmittedTasks
);

router.post(
  "/admin/:id/approve",
  auth,
  rateLimiter({
    windowMs: 60 * 1000,
    max: 20,
  }),
  taskController.approveTask
);

router.post(
  "/admin/:id/reject",
  auth,
  rateLimiter({
    windowMs: 60 * 1000,
    max: 20,
  }),
  taskController.rejectTask
);

// Get task details
router.get("/:id", auth, taskController.getTaskDetails);

export { router as taskRouter };
