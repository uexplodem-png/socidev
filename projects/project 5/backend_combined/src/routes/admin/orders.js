import express from 'express';
import { Op } from 'sequelize';
import { Order, User, Transaction, ActivityLog } from '../../models/index.js';
import { validate, schemas } from '../../middleware/validation.js';
import { asyncHandler, NotFoundError } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders with filtering and pagination
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [instagram, youtube, twitter, tiktok, all]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled, refunded, all]
 *     responses:
 *       200:
 *         description: List of orders with pagination
 */
router.get('/',
  requirePermission('orders.view'),
  validate(schemas.orderQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, search, platform, status, sortBy, sortOrder } = req.query;

    // Build where clause
    const where = {};

    if (search) {
      where[Op.or] = [
        { user_name: { [Op.like]: `%${search}%` } },
        { user_email: { [Op.like]: `%${search}%` } },
        { target_url: { [Op.like]: `%${search}%` } },
        { service: { [Op.like]: `%${search}%` } },
      ];
    }

    if (platform && platform !== 'all') {
      where.platform = platform;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch orders with pagination
    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'username'],
        },
      ],
    });

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   get:
 *     summary: Get order details by ID
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order details with related data
 *       404:
 *         description: Order not found
 */
router.get('/:id',
  requirePermission('orders.view'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'username'],
        },
        {
          model: Transaction,
          as: 'transactions',
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!order) {
      throw new NotFoundError('Order');
    }

    res.json({
      order,
    });
  })
);

/**
 * @swagger
 * /api/admin/orders/{id}/status:
 *   post:
 *     summary: Update order status
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, completed, failed, cancelled, refunded]
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       404:
 *         description: Order not found
 */
router.post('/:id/status',
  requirePermission('orders.edit'),
  validate(schemas.updateOrderStatus),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      throw new NotFoundError('Order');
    }

    const originalStatus = order.status;
    
    // Update order status
    await order.update({ 
      status,
      notes: notes || order.notes,
    });

    // Log the status change
    await ActivityLog.log(
      req.user.id,
      'ORDER_STATUS_UPDATED',
      'order',
      id,
      order.user_id,
      `Order status changed from ${originalStatus} to ${status}`,
      {
        originalStatus,
        newStatus: status,
        notes,
      },
      req
    );

    res.json({
      order,
      message: 'Order status updated successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/orders/{id}/refund:
 *   post:
 *     summary: Refund an order
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *               partial:
 *                 type: boolean
 *                 default: false
 *               refundAmount:
 *                 type: number
 *                 minimum: 0.01
 *     responses:
 *       200:
 *         description: Order refunded successfully
 *       400:
 *         description: Order cannot be refunded
 *       404:
 *         description: Order not found
 */
router.post('/:id/refund',
  requirePermission('orders.refund'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason, partial = false, refundAmount } = req.body;

    const order = await Order.findByPk(id, {
      include: [{ model: User, as: 'user' }],
    });

    if (!order) {
      throw new NotFoundError('Order');
    }

    // Check if order can be refunded
    if (!order.canBeRefunded()) {
      return res.status(400).json({
        error: 'Order cannot be refunded',
        code: 'CANNOT_REFUND',
        currentStatus: order.status,
      });
    }

    // Calculate refund amount
    const finalRefundAmount = partial && refundAmount 
      ? Math.min(refundAmount, order.amount)
      : order.amount;

    // Update user balance
    const user = order.user;
    const newBalance = parseFloat(user.balance) + finalRefundAmount;
    await user.update({ balance: newBalance });

    // Update order status
    await order.update({ 
      status: partial ? 'processing' : 'refunded',
    });

    // Create refund transaction
    const transaction = await Transaction.create({
      userId: order.userId,
      orderId: order.id,
      type: 'refund',
      amount: finalRefundAmount,
      status: 'completed',
      method: 'balance',
      details: {
        reason,
        partial,
        originalAmount: order.amount,
      },
      reference: order.id,
    });

    // Log the refund
    await ActivityLog.log(
      req.user.id,
      'ORDER_REFUNDED',
      'order',
      id,
      order.user_id,
      `Order refunded - Amount: $${finalRefundAmount}${reason ? `, Reason: ${reason}` : ''}`,
      {
        refundAmount: finalRefundAmount,
        originalAmount: order.amount,
        partial,
        reason,
      },
      req
    );

    res.json({
      order,
      transaction,
      message: `Order ${partial ? 'partially ' : ''}refunded successfully`,
    });
  })
);

/**
 * @swagger
 * /api/admin/orders:
 *   post:
 *     summary: Create a new order (admin only)
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrder'
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 */
router.post('/',
  requirePermission('orders.edit'),
  validate(schemas.createOrder),
  asyncHandler(async (req, res) => {
    const orderData = req.body;

    // Verify user exists
    const user = await User.findByPk(orderData.user_id);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Create order
    const order = await Order.create({
      userId: orderData.user_id,
      platform: orderData.platform,
      service: orderData.service,
      targetUrl: orderData.target_url,
      quantity: orderData.quantity,
      amount: orderData.amount,
      remainingCount: orderData.quantity,
      user_name: `${user.first_name} ${user.last_name}`,
      user_email: user.email,
    });

    // Log order creation
    await ActivityLog.log(
      req.user.id,
      'ORDER_CREATED',
      'order',
      order.id,
      user.id,
      `Order created by admin - ${orderData.service} for ${orderData.platform}`,
      {
        platform: orderData.platform,
        service: orderData.service,
        quantity: orderData.quantity,
        amount: orderData.amount,
      },
      req
    );

    res.status(201).json({
      order,
      message: 'Order created successfully',
    });
  })
);

export default router;