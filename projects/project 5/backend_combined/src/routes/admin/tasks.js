import express from 'express';
import { Op } from 'sequelize';
import { Task, User, ActivityLog } from '../../models/index.js';
import { validate, schemas } from '../../middleware/validation.js';
import { asyncHandler, NotFoundError } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import { settingsService } from '../../services/settingsService.js';
import { logAction } from '../../utils/logging.js';
import Joi from 'joi';

const router = express.Router();

/**
 * @swagger
 * /api/admin/tasks:
 *   get:
 *     summary: Get all tasks with filtering and pagination
 *     tags: [Admin Tasks]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [like, follow, view, subscribe, comment, share, all]
 *       - in: query
 *         name: admin_status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, all]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled, all]
 *     responses:
 *       200:
 *         description: List of tasks with pagination
 */
router.get('/',
  requirePermission('tasks.view'),
  validate(schemas.taskQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, search, platform, type, admin_status, status, sortBy, sortOrder } = req.query;

    // Build where clause
    const where = {};

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { target_url: { [Op.like]: `%${search}%` } },
      ];
    }

    if (platform && platform !== 'all') {
      where.platform = platform;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (admin_status && admin_status !== 'all') {
      where.admin_status = admin_status;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch tasks with pagination
    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      attributes: ['id', 'userId', 'orderId', 'title', 'description', 'type', 'platform', 'targetUrl', 'quantity', 'remainingQuantity', 'rate', 'priority', 'status', 'adminStatus', 'adminReviewedBy', 'adminReviewedAt', 'createdAt', 'updatedAt'],
      limit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'username'],
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
      ],
    });

    res.json({
      tasks,
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
 * /api/admin/tasks/pending:
 *   get:
 *     summary: Get pending tasks for approval
 *     tags: [Admin Tasks]
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
 *     responses:
 *       200:
 *         description: List of pending tasks
 */
router.get('/pending',
  requirePermission('tasks.view'),
  validate(schemas.paginationQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: tasks } = await Task.findAndCountAll({
      where: { admin_status: 'pending' },
      attributes: ['id', 'userId', 'orderId', 'title', 'description', 'type', 'platform', 'targetUrl', 'quantity', 'remainingQuantity', 'rate', 'priority', 'status', 'adminStatus', 'createdAt'],
      limit,
      offset,
      order: [['created_at', 'ASC']], // Oldest first for FIFO processing
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'username'],
        },
      ],
    });

    res.json({
      tasks,
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
 * /api/admin/tasks/{id}:
 *   get:
 *     summary: Get task details by ID
 *     tags: [Admin Tasks]
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
 *         description: Task details
 *       404:
 *         description: Task not found
 */
router.get('/:id',
  requirePermission('tasks.view'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      attributes: ['id', 'userId', 'orderId', 'title', 'description', 'type', 'platform', 'targetUrl', 'quantity', 'remainingQuantity', 'rate', 'priority', 'status', 'adminStatus', 'adminReviewedBy', 'adminReviewedAt', 'requirements', 'createdAt', 'updatedAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'username'],
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
        {
          association: 'order',
          attributes: ['id', 'userId', 'platform', 'service', 'targetUrl', 'quantity', 'status', 'amount', 'createdAt', 'updatedAt'],
        },
      ],
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    res.json({
      task,
    });
  })
);

/**
 * @swagger
 * /api/admin/tasks/{id}/approve:
 *   post:
 *     summary: Approve a task
 *     tags: [Admin Tasks]
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
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Task approved successfully
 *       404:
 *         description: Task not found
 *       400:
 *         description: Task cannot be approved
 */
router.post('/:id/approve',
  requirePermission('tasks.approve'),
  validate(schemas.approveTask),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;

    // Check if task approvals are enabled
    const features = await settingsService.get('features.tasks', {});
    if (features.approveEnabled === false) {
      return res.status(403).json({
        error: 'Task approval is currently disabled',
        code: 'FEATURE_DISABLED',
      });
    }

    const task = await Task.findByPk(id, {
      attributes: ['id', 'userId', 'orderId', 'type', 'platform', 'quantity', 'rate', 'adminStatus'],
    });
    if (!task) {
      throw new NotFoundError('Task');
    }

    if (task.admin_status !== 'pending') {
      return res.status(400).json({
        error: 'Task is not pending approval',
        code: 'TASK_NOT_PENDING',
        currentStatus: task.admin_status,
      });
    }

    // Approve task
    await task.approve(req.user.id, notes);

    // Log the approval
    await logAction(req, {
      userId: task.userId || req.user.id,
      type: 'TASK_APPROVED',
      action: 'approve',
      details: `Task approved - ${task.type} on ${task.platform}${notes ? `: ${notes}` : ''}`,
    });

    res.json({
      task,
      message: 'Task approved successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/tasks/{id}/reject:
 *   post:
 *     summary: Reject a task
 *     tags: [Admin Tasks]
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Task rejected successfully
 *       404:
 *         description: Task not found
 *       400:
 *         description: Task cannot be rejected
 */
router.post('/:id/reject',
  requirePermission('tasks.reject'),
  validate(schemas.rejectTask),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason, notes } = req.body;

    // Check if task rejections are enabled
    const features = await settingsService.get('features.tasks', {});
    if (features.rejectEnabled === false) {
      return res.status(403).json({
        error: 'Task rejection is currently disabled',
        code: 'FEATURE_DISABLED',
      });
    }

    const task = await Task.findByPk(id, {
      attributes: ['id', 'userId', 'orderId', 'type', 'platform', 'adminStatus', 'requirements'],
    });
    if (!task) {
      throw new NotFoundError('Task');
    }

    if (task.admin_status !== 'pending') {
      return res.status(400).json({
        error: 'Task is not pending approval',
        code: 'TASK_NOT_PENDING',
        currentStatus: task.admin_status,
      });
    }

    // Reject task
    await task.reject(req.user.id, reason);
    if (notes) {
      await task.update({ requirements: notes });
    }

    // Log the rejection
    await logAction(req, {
      userId: task.userId || req.user.id,
      type: 'TASK_REJECTED',
      action: 'reject',
      details: `Task rejected - Reason: ${reason}${notes ? `, Notes: ${notes}` : ''}`,
    });

    res.json({
      task,
      message: 'Task rejected successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/tasks/bulk-approve:
 *   post:
 *     summary: Bulk approve tasks
 *     tags: [Admin Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - task_ids
 *             properties:
 *               task_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Tasks approved successfully
 */
router.post('/bulk-approve',
  requirePermission('tasks.approve'),
  validate(Joi.object({
    task_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
    notes: Joi.string().max(500).optional(),
  })),
  asyncHandler(async (req, res) => {
    const { task_ids, notes } = req.body;

    // Find all pending tasks
    const tasks = await Task.findAll({
      where: {
        id: { [Op.in]: task_ids },
        admin_status: 'pending',
      },
      attributes: ['id', 'userId', 'type', 'platform', 'quantity', 'rate', 'adminStatus'],
    });

    if (tasks.length === 0) {
      return res.status(400).json({
        error: 'No pending tasks found',
        code: 'NO_PENDING_TASKS',
      });
    }

    // Approve all tasks
    const approvedTasks = [];
    for (const task of tasks) {
      await task.approve(req.user.id, notes);
      approvedTasks.push(task);

      // Log each approval
      await logAction(req, {
        userId: task.userId || req.user.id,
        type: 'TASK_APPROVED',
        action: 'approve',
        details: `Task approved via bulk action - ${task.type} on ${task.platform}${notes ? `: ${notes}` : ''}`,
      });
    }

    res.json({
      approvedTasks,
      message: `${approvedTasks.length} task(s) approved successfully`,
    });
  })
);

/**
 * @swagger
 * /api/admin/tasks/bulk-reject:
 *   post:
 *     summary: Bulk reject tasks
 *     tags: [Admin Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - task_ids
 *               - reason
 *             properties:
 *               task_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Tasks rejected successfully
 */
router.post('/bulk-reject',
  requirePermission('tasks.reject'),
  validate(schemas.bulkTaskAction),
  asyncHandler(async (req, res) => {
    const { task_ids, reason, notes } = req.body;

    // Find all pending tasks
    const tasks = await Task.findAll({
      where: {
        id: { [Op.in]: task_ids },
        admin_status: 'pending',
      },
      attributes: ['id', 'userId', 'type', 'platform', 'requirements', 'adminStatus'],
    });

    if (tasks.length === 0) {
      return res.status(400).json({
        error: 'No pending tasks found',
        code: 'NO_PENDING_TASKS',
      });
    }

    // Reject all tasks
    const rejectedTasks = [];
    for (const task of tasks) {
      await task.reject(req.user.id, reason);
      if (notes) {
        await task.update({ requirements: notes });
      }
      rejectedTasks.push(task);

      // Log each rejection
      await logAction(req, {
        userId: task.userId || req.user.id,
        type: 'TASK_REJECTED',
        action: 'reject',
        details: `Task rejected via bulk action - Reason: ${reason}${notes ? `, Notes: ${notes}` : ''}`,
      });
    }

    res.json({
      rejectedTasks,
      message: `${rejectedTasks.length} task(s) rejected successfully`,
    });
  })
);

/**
 * @swagger
 * /api/admin/tasks:
 *   post:
 *     summary: Create a new task (admin only)
 *     tags: [Admin Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTask'
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Validation error
 */
router.post('/',
  requirePermission('tasks.edit'),
  validate(schemas.createTask),
  asyncHandler(async (req, res) => {
    const taskData = req.body;

    // Create task with admin pre-approval
    const task = await Task.create({
      ...taskData,
      user_id: req.user.id, // Admin is creating the task
      remaining_quantity: taskData.quantity,
      admin_status: 'approved', // Auto-approve admin-created tasks
      admin_reviewed_by: req.user.id,
      admin_reviewed_at: new Date(),
    });

    // Log task creation
    await logAction(req, {
      userId: req.user.id,
      type: 'TASK_CREATED',
      action: 'create',
      details: `Task created by admin - ${taskData.type} on ${taskData.platform}`,
    });

    res.status(201).json({
      task,
      message: 'Task created successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/tasks/{id}/priority:
 *   patch:
 *     summary: Update task priority
 *     tags: [Admin Tasks]
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
 *               - priority
 *             properties:
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *     responses:
 *       200:
 *         description: Task priority updated successfully
 *       404:
 *         description: Task not found
 */
router.patch('/:id/priority',
  requirePermission('tasks.edit'),
  validate(Joi.object({
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').required(),
  })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { priority } = req.body;

    const task = await Task.findByPk(id, {
      attributes: ['id', 'userId', 'priority'],
    });
    if (!task) {
      throw new NotFoundError('Task');
    }

    const originalPriority = task.priority;
    await task.update({ priority });

    // Log priority change
    await logAction(req, {
      userId: task.userId || req.user.id,
      type: 'TASK_PRIORITY_UPDATED',
      action: 'update',
      details: `Task priority changed from ${originalPriority} to ${priority}`,
    });

    res.json({
      task,
      message: 'Task priority updated successfully',
    });
  })
);

export default router;