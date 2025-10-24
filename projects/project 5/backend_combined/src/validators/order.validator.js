import { body } from "express-validator";
import { validateRequest } from "../middleware/validate-request.js";

export const validateOrder = [
  body("platform")
    .isIn(["instagram", "youtube", "twitter", "tiktok"])
    .withMessage("Invalid platform"),

  body("service").isString().notEmpty().withMessage("Service is required"),

  body("targetUrl").isString().notEmpty().withMessage("Target URL is required"),

  body("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be greater than 0"),

  body("speed")
    .optional()
    .isIn(["normal", "fast", "express"])
    .withMessage("Invalid speed option"),

  validateRequest,
];

export const validateBulkOrder = [
  body("orders")
    .isArray({ min: 1 })
    .withMessage("At least one order is required"),

  body("orders.*.platform")
    .isIn(["instagram", "youtube", "twitter", "tiktok"])
    .withMessage("Invalid platform"),

  body("orders.*.service")
    .isString()
    .notEmpty()
    .withMessage("Service is required"),

  body("orders.*.targetUrl").isString().notEmpty().withMessage("Target URL is required"),

  body("orders.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be greater than 0"),

  body("orders.*.speed")
    .optional()
    .isIn(["normal", "fast", "express"])
    .withMessage("Invalid speed option"),

  validateRequest,
];

export const validateOrderReport = [
  body("type")
    .isIn(["order_issue", "payment_issue", "technical_issue", "other"])
    .withMessage("Invalid report type"),

  body("description")
    .isString()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),

  validateRequest,
];
