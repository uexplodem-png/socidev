import express from "express";
import { TaskController } from "../controllers/task.controller.js";
import { authenticateToken as auth } from "../middleware/auth.js";
import { validateTaskCompletion } from "../validators/task.validator.js";
import { rateLimiter } from "../middleware/rate-limiter.js";

const router = express.Router();
const taskController = new TaskController();

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

// Start task
router.post(
  "/:id/start",
  auth,
  rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 task starts per minute
  }),
  taskController.startTask
);

// Complete task
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

// Get task details
router.get("/:id", auth, taskController.getTaskDetails);

export { router as taskRouter };
