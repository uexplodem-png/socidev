import express from "express";
import { OrderController } from "../controllers/order.controller.js";
import { authenticateToken as auth } from "../middleware/auth.js";
import {
  validateOrder,
  validateBulkOrder,
  validateOrderReport,
} from "../validators/order.validator.js";

const router = express.Router();
const orderController = new OrderController();

// Get order statistics
router.get("/stats", auth, orderController.getOrderStats);

// Get user's orders
router.get("/", auth, orderController.getOrders);

// Get order details
router.get("/:id", auth, orderController.getOrderDetails);

// Create single order
router.post("/", auth, validateOrder, orderController.createOrder);

// Create bulk orders
router.post("/bulk", auth, validateBulkOrder, orderController.createBulkOrders);

// Report order issue
router.post(
  "/:id/report",
  auth,
  validateOrderReport,
  orderController.reportIssue
);

// Repeat order
router.post("/:id/repeat", auth, orderController.repeatOrder);

export { router as orderRouter };
