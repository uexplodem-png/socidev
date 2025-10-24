import { body } from "express-validator";
import { validateRequest } from "../middleware/validate-request.js";

export const validateDevice = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Device name is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Device name must be between 3 and 50 characters"),

  body("type")
    .isIn(["PC", "Laptop", "Mobile"])
    .withMessage("Invalid device type"),

  body("notes")
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters"),

  validateRequest,
];

export const validateDeviceSettings = [
  body("autoRenew")
    .optional()
    .isBoolean()
    .withMessage("Auto renew must be a boolean"),

  body("maxDailyTasks")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Max daily tasks must be between 1 and 50"),

  body("notifications")
    .optional()
    .isObject()
    .withMessage("Invalid notifications format"),

  body("notifications.email")
    .optional()
    .isBoolean()
    .withMessage("Email notification setting must be boolean"),

  body("notifications.browser")
    .optional()
    .isBoolean()
    .withMessage("Browser notification setting must be boolean"),

  validateRequest,
];
