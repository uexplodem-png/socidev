import express from 'express';
import { Op } from 'sequelize';
import { Order, User, Transaction, ActivityLog, Task } from '../../models/index.js';
import { validate, schemas } from '../../middleware/validation.js';
import { asyncHandler, NotFoundError } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import { settingsService } from '../../services/settingsService.js';
import { logAudit, logAction } from '../../utils/logging.js';

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
      attributes: ['id', 'userId', 'platform', 'service', 'targetUrl', 'quantity', 'amount', 'status', 'remainingCount', 'completedCount', 'speed', 'createdAt', 'updatedAt', 'startedAt', 'completedAt'],
      limit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'username'],
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
      attributes: ['id', 'userId', 'platform', 'service', 'targetUrl', 'quantity', 'amount', 'status', 'remainingCount', 'completedCount', 'speed', 'notes', 'createdAt', 'updatedAt', 'startedAt', 'completedAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'username'],
        },
        {
          model: Transaction,
          as: 'transactions',
          attributes: ['id', 'type', 'amount', 'status', 'method', 'description', 'createdAt'],
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

    // Check if order status updates are enabled
    const features = await settingsService.get('features.orders', {});
    if (features.editEnabled === false) {
      return res.status(403).json({
        error: 'Order status updates are currently disabled',
        code: 'FEATURE_DISABLED',
      });
    }

    console.log(`[ORDER STATUS UPDATE] Received request for order ${id}, new status: ${status}`);

    const order = await Order.findByPk(id, {
      attributes: ['id', 'userId', 'platform', 'service', 'targetUrl', 'quantity', 'amount', 'status', 'remainingCount', 'completedCount', 'speed', 'notes'],
    });
    if (!order) {
      throw new NotFoundError('Order');
    }

    const originalStatus = order.status;
    console.log(`[ORDER STATUS UPDATE] Original status: ${originalStatus}, New status: ${status}`);
    
    // Update order status
    await order.update({ 
      status,
      notes: notes || order.notes,
    });

    console.log(`[ORDER STATUS UPDATE] Order updated. Checking if task should be created...`);
    console.log(`[ORDER STATUS UPDATE] Condition check: status === 'processing' (${status === 'processing'}) && originalStatus !== 'processing' (${originalStatus !== 'processing'})`);

    // If status is changed to "processing", create a task for task doers
    if (status === 'processing' && originalStatus !== 'processing') {
      console.log(`[TASK CREATION] Creating task for order ${id}`);
      
      try {
        // Map the service to a task type (like, follow, view, subscribe, comment, share)
        // Default to the service name, or map known services
        const serviceTypeMap = {
          'like': 'like',
          'follow': 'follow',
          'view': 'view',
          'subscribe': 'subscribe',
          'comment': 'comment',
          'share': 'share',
        };
        
        const taskType = serviceTypeMap[order.service.toLowerCase()] || 'like';
        console.log(`[TASK CREATION] Task type: ${taskType}, Platform: ${order.platform}, Service: ${order.service}`);
        
        // Calculate rate per unit - divide total amount by quantity
        const ratePerUnit = parseFloat(order.amount) / order.quantity;
        console.log(`[TASK CREATION] Rate: ${ratePerUnit}, Quantity: ${order.quantity}`);
        
        // Create a task for task doers
        const task = await Task.create({
          userId: null, // No specific user assigned yet
          orderId: order.id,
          title: `${order.platform.charAt(0).toUpperCase() + order.platform.slice(1)} - ${order.service}`,
          description: `Complete ${order.quantity} ${order.service} on ${order.targetUrl}`,
          type: taskType,
          platform: order.platform,
          targetUrl: order.targetUrl,
          quantity: order.quantity,
          remainingQuantity: order.quantity,
          rate: ratePerUnit,
          priority: order.speed === 'express' ? 'urgent' : order.speed === 'fast' ? 'high' : 'medium',
          requirements: `Complete ${order.quantity} ${order.service} on the target URL`,
          status: 'pending',
          adminStatus: 'approved', // Auto-approve tasks created from orders
        });

        console.log(`[TASK CREATION] Task created successfully: ${task.id}`);

        // Log the task creation
        await ActivityLog.log(
          req.user.id,
          'TASK_CREATED_FROM_ORDER',
          'task',
          task.id,
          null,
          `Task created from order - ${order.quantity} ${order.service} on ${order.platform}`,
          {
            orderId: order.id,
            taskId: task.id,
            service: order.service,
            quantity: order.quantity,
            platform: order.platform,
          },
          req
        );
      } catch (taskError) {
        console.error('[TASK CREATION ERROR]', taskError.message);
        console.error('[TASK CREATION ERROR]', taskError);
        // Don't fail the entire request if task creation fails
        await ActivityLog.log(
          req.user.id,
          'TASK_CREATION_FAILED',
          'order',
          order.id,
          null,
          `Failed to create task from order: ${taskError.message}`,
          {
            error: taskError.message,
            orderId: order.id,
          },
          req
        );
      }
    } else {
      console.log(`[TASK CREATION] Skipping task creation: status === 'processing'? ${status === 'processing'}, originalStatus !== 'processing'? ${originalStatus !== 'processing'}`);
    }

    // Log the status change
    await logAction(req, {
      userId: order.userId || req.user.id,
      type: 'ORDER_STATUS_UPDATED',
      action: 'update',
      details: `Order status changed from ${originalStatus} to ${status}${notes ? ': ' + notes : ''}`,
    });

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

    // Check if order refunds are enabled
    const features = await settingsService.get('features.orders', {});
    if (features.refundEnabled === false) {
      return res.status(403).json({
        error: 'Order refunds are currently disabled',
        code: 'FEATURE_DISABLED',
      });
    }

    const order = await Order.findByPk(id, {
      attributes: ['id', 'userId', 'amount', 'status', 'service', 'platform', 'targetUrl', 'quantity'],
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'balance'] }],
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
    const orderAmount = parseFloat(order.amount);
    const finalRefundAmount = partial && refundAmount 
      ? Math.min(refundAmount, orderAmount)
      : orderAmount;

    // Update user balance
    const user = order.user;
    const currentBalance = parseFloat(user.balance);
    const newBalance = currentBalance + finalRefundAmount;
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
    await logAudit(req, {
      action: 'ORDER_REFUNDED',
      resource: 'order',
      resourceId: id,
      targetUserId: order.userId,
      targetUserName: order.user ? `${order.user.firstName} ${order.user.lastName}` : null,
      description: `Order ${partial ? 'partially ' : ''}refunded - Amount: $${finalRefundAmount}${reason ? `, Reason: ${reason}` : ''}`,
      metadata: {
        refundAmount: finalRefundAmount,
        originalAmount: order.amount,
        partial,
        reason,
      }
    });

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
    const user = await User.findByPk(orderData.user_id, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'balance'],
    });
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
    });

    // Log order creation
    await logAudit(req, {
      action: 'ORDER_CREATED',
      resource: 'order',
      resourceId: order.id,
      targetUserId: user.id,
      targetUserName: `${user.firstName} ${user.lastName}`,
      description: `Order created by admin - ${orderData.service} for ${orderData.platform}`,
      metadata: {
        platform: orderData.platform,
        service: orderData.service,
        quantity: orderData.quantity,
        amount: orderData.amount,
      }
    });

    res.status(201).json({
      order,
      message: 'Order created successfully',
    });
  })
);

export default router;