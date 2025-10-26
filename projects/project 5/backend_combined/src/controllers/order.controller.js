import { OrderService } from "../services/order.service.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  validateOrder,
  validateBulkOrder,
  validateOrderReport,
} from "../validators/order.validator.js";

const orderService = new OrderService();

export class OrderController {
  // Get order statistics
  getOrderStats = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { platform, timeframe = "30d" } = req.query;

    const stats = await orderService.getOrderStats(userId, {
      platform,
      timeframe,
    });
    res.json(stats);
  });

  // Get user's orders
  getOrders = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const {
      status,
      platform,
      service,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filters = {
      status,
      platform,
      service,
      startDate,
      endDate,
    };

    const orders = await orderService.getOrders(userId, {
      filters,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
    });

    res.json(orders);
  });

  // Get order details
  getOrderDetails = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const orderId = req.params.id;

    const order = await orderService.getOrderDetails(userId, orderId);
    res.json(order);
  });

  // Get specific order stats (progress tracking)
  getOrderStatsById = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const orderId = req.params.id;

    const stats = await orderService.getOrderStatsById(userId, orderId);
    res.json(stats);
  });

  // Create single order
  createOrder = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const order = await orderService.createOrder(userId, req.body);
    res.status(201).json(order);
  });

  // Create bulk orders
  createBulkOrders = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const createdOrders = await orderService.createBulkOrders(userId, req.body);
    res.status(201).json(createdOrders);
  });

  // Report order issue
  reportIssue = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const orderId = req.params.id;
    const report = await orderService.createOrderReport(
      userId,
      orderId,
      req.body
    );
    res.status(201).json(report);
  });

  // Repeat order
  repeatOrder = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const orderId = req.params.id;
    const newOrder = await orderService.repeatOrder(userId, orderId);
    res.status(201).json(newOrder);
  });
}
