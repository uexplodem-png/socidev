import express from 'express';
import { Op } from 'sequelize';
import { Task, User, ActivityLog } from '../../models/index.js';
import { validate, schemas } from '../../middleware/validation.js';
import { asyncHandler, NotFoundError } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
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
      limit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'username'],
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'first_name', 'last_name', 'email'],
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
      limit,
      offset,
      order: [['created_at', 'ASC']], // Oldest first for FIFO processing
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'username'],
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
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'username'],
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false,
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

    const task = await Task.findByPk(id);
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
    await ActivityLog.log(
      req.user.id,
      'TASK_APPROVED',
      'task',
      id,
      task.user_id,
      `Task approved - ${task.type} on ${task.platform}${notes ? `: ${notes}` : ''}`,
      {
        taskType: task.type,
        platform: task.platform,
        quantity: task.quantity,
        rate: task.rate,
        notes,
      },
      req
    );

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

    const task = await Task.findByPk(id);
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
    await ActivityLog.log(
      req.user.id,
      'TASK_REJECTED',
      'task',
      id,
      task.user_id,
      `Task rejected - Reason: ${reason}${notes ? `, Notes: ${notes}` : ''}`,
      {
        taskType: task.type,
        platform: task.platform,
        rejectionReason: reason,
        notes,
      },
      req
    );

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
      await ActivityLog.log(
        req.user.id,
        'TASK_APPROVED',
        'task',
        task.id,
        task.user_id,
        `Task approved via bulk action - ${task.type} on ${task.platform}`,
        {
          bulkAction: true,
          taskType: task.type,
          platform: task.platform,
          notes,
        },
        req
      );
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
      await ActivityLog.log(
        req.user.id,
        'TASK_REJECTED',
        'task',
        task.id,
        task.user_id,
        `Task rejected via bulk action - Reason: ${reason}`,
        {
          bulkAction: true,
          taskType: task.type,
          platform: task.platform,
          rejectionReason: reason,
          notes,
        },
        req
      );
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
    await ActivityLog.log(
      req.user.id,
      'TASK_CREATED',
      'task',
      task.id,
      req.user.id,
      `Task created by admin - ${taskData.type} on ${taskData.platform}`,
      {
        taskType: taskData.type,
        platform: taskData.platform,
        quantity: taskData.quantity,
        rate: taskData.rate,
      },
      req
    );

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

    const task = await Task.findByPk(id);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const originalPriority = task.priority;
    await task.update({ priority });

    // Log priority change
    await ActivityLog.log(
      req.user.id,
      'TASK_PRIORITY_UPDATED',
      'task',
      id,
      task.user_id,
      `Task priority changed from ${originalPriority} to ${priority}`,
      {
        originalPriority,
        newPriority: priority,
      },
      req
    );

    res.json({
      task,
      message: 'Task priority updated successfully',
    });
  })
);

export default router;