import { body } from "express-validator";

export const validateInstagramAccount = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 1, max: 30 })
    .withMessage("Username must be between 1 and 30 characters")
    .matches(/^[a-zA-Z0-9._]+$/)
    .withMessage(
      "Username can only contain letters, numbers, dots and underscores"
    ),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

export const validateAccountSettings = [
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
    .withMessage("Notifications must be an object"),

  body("notifications.email")
    .optional()
    .isBoolean()
    .withMessage("Email notification setting must be a boolean"),

  body("notifications.browser")
    .optional()
    .isBoolean()
    .withMessage("Browser notification setting must be a boolean"),

  body("privacy")
    .optional()
    .isObject()
    .withMessage("Privacy must be an object"),

  body("privacy.hideStats")
    .optional()
    .isBoolean()
    .withMessage("Hide stats setting must be a boolean"),

  body("privacy.privateProfile")
    .optional()
    .isBoolean()
    .withMessage("Private profile setting must be a boolean"),
];
