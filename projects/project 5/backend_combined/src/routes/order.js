import express from "express";
import { OrderController } from "../controllers/order.controller.js";
import { authenticateToken as auth } from "../middleware/auth.js";
import {
  validateOrder,
  validateBulkOrder,
  validateOrderReport,
} from "../validators/order.validator.js";
import { enforceFeatureFlag, enforceModeRequirements } from "../middleware/settingsEnforcement.js";

const router = express.Router();
const orderController = new OrderController();

// Apply feature flag check to all order routes
router.use(enforceFeatureFlag('features.orders.moduleEnabled', 'Orders module is currently disabled'));

// Get order statistics
router.get("/stats", auth, orderController.getOrderStats);

// Get user's orders
router.get("/", auth, orderController.getOrders);

// Get order details
router.get("/:id", auth, orderController.getOrderDetails);

// Get specific order stats (progress tracking)
router.get("/:id/stats", auth, orderController.getOrderStatsById);

// Create single order - requires task giver verification and minimum balance
router.post("/", auth, enforceModeRequirements('task_giver'), validateOrder, orderController.createOrder);

// Create bulk orders - requires task giver verification and minimum balance
router.post("/bulk", auth, enforceModeRequirements('task_giver'), validateBulkOrder, orderController.createBulkOrders);

// Report order issue
router.post(
  "/:id/report",
  auth,
  validateOrderReport,
  orderController.reportIssue
);

// Repeat order - requires task giver verification and minimum balance
router.post("/:id/repeat", auth, enforceModeRequirements('task_giver'), orderController.repeatOrder);

export { router as orderRouter };
