/**
 * PART 5: Task Execution & 15-Minute Timer System
 * Handles task reservation, submission, approval, and rejection
 * with automatic expiry after 15 minutes
 */

import express from 'express';
import { body, param } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { Op } from 'sequelize';
import { Task, TaskExecution, User, Order } from '../models/index.js';
import { authenticateToken as auth, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logAudit } from '../utils/logging.js';
import { sequelize } from '../config/database.js';

const router = express.Router();

// Rate limiting for task reservations - 20 per hour
const reservationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    error: 'Too many task reservations. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Reserve a task (starts 15-minute timer)
 */
router.post('/tasks/:taskId/reserve',
  auth,
  reservationLimiter,
  param('taskId').isUUID(),
  asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const transaction = await sequelize.transaction();

    try {
      // Lock task for update to prevent race conditions
      const task = await Task.findByPk(taskId, {
        attributes: ['id', 'remainingQuantity', 'status', 'excludedUserId', 'orderId', 'quantity', 'rate'],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!task) {
        await transaction.rollback();
        return res.status(404).json({
          error: 'Task not found',
          code: 'TASK_NOT_FOUND'
        });
      }

      // Check if task is active
      if (task.status !== 'pending' && task.status !== 'in_progress') {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Task is not available for reservation',
          code: 'TASK_NOT_AVAILABLE',
          currentStatus: task.status
        });
      }

      // **PART 5: Check if user is excluded (order owner)**
      if (task.excludedUserId && task.excludedUserId === req.user.id) {
        await transaction.rollback();
        return res.status(403).json({
          error: 'You cannot execute your own order task',
          code: 'USER_EXCLUDED'
        });
      }

      // Check if user already has an execution for this task
      const existingExecution = await TaskExecution.findOne({
        where: {
          taskId,
          userId: req.user.id
        },
        attributes: ['id', 'status'],
        transaction
      });

      if (existingExecution) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'You have already reserved or completed this task',
          code: 'ALREADY_RESERVED',
          executionStatus: existingExecution.status
        });
      }

      // Check if task has remaining slots
      if (task.remainingQuantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Task is fully reserved',
          code: 'NO_SLOTS_AVAILABLE'
        });
      }

      // **PART 5: Create execution with 15-minute expiry**
      const reservedAt = new Date();
      const expiresAt = new Date(reservedAt.getTime() + 15 * 60 * 1000); // 15 minutes

      const execution = await TaskExecution.create({
        taskId,
        userId: req.user.id,
        status: 'pending',
        reservedAt,
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }, { transaction });

      // Decrement remaining quantity
      await task.decrement('remainingQuantity', { by: 1, transaction });

      // Update task status if needed
      if (task.status === 'pending') {
        await task.update({ status: 'in_progress' }, { transaction });
      }

      // Log audit
      await logAudit(req, {
        action: 'TASK_RESERVED',
        resource: 'task_execution',
        resourceId: execution.id,
        description: `Task #${taskId.substring(0, 8)} reserved for 15 minutes`,
        metadata: {
          taskId,
          executionId: execution.id,
          expiresAt,
          remainingQuantity: task.remainingQuantity - 1
        }
      });

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: 'Task reserved successfully. You have 15 minutes to complete it.',
        execution: {
          id: execution.id,
          taskId: task.id,
          status: 'pending',
          reservedAt,
          expiresAt,
          timeRemaining: 15 * 60 // seconds
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  })
);

/**
 * Submit task execution (before expiry)
 */
router.patch('/executions/:id/submit',
  auth,
  param('id').isUUID(),
  body('proofUrl')
    .trim()
    .notEmpty().withMessage('Proof URL is required')
    .isURL().withMessage('Invalid proof URL'),
  body('submissionNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters')
    .escape(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { proofUrl, submissionNotes } = req.body;

    const execution = await TaskExecution.findOne({
      where: {
        id,
        userId: req.user.id,
        status: 'pending'
      },
      attributes: ['id', 'taskId', 'userId', 'status', 'expiresAt', 'reservedAt']
    });

    if (!execution) {
      return res.status(404).json({
        error: 'Execution not found or already submitted',
        code: 'EXECUTION_NOT_FOUND'
      });
    }

    // **PART 5: Check if execution has expired**
    const now = new Date();
    if (now > new Date(execution.expiresAt)) {
      // Mark as expired
      await execution.update({ status: 'expired' });
      
      // Return slot to task
      await Task.increment('remainingQuantity', {
        by: 1,
        where: { id: execution.taskId }
      });

      await logAudit(req, {
        action: 'TASK_EXECUTION_EXPIRED',
        resource: 'task_execution',
        resourceId: execution.id,
        description: `Task execution expired (15-minute limit exceeded)`,
        metadata: {
          taskId: execution.taskId,
          reservedAt: execution.reservedAt,
          expiresAt: execution.expiresAt
        }
      });

      return res.status(400).json({
        error: 'Task execution has expired. Please reserve again.',
        code: 'EXECUTION_EXPIRED',
        expiresAt: execution.expiresAt
      });
    }

    // Update execution with submission
    await execution.update({
      proofUrl,
      submissionNotes,
      submittedAt: new Date(),
      status: 'submitted' // Waiting for admin approval
    });

    // Log audit
    await logAudit(req, {
      action: 'TASK_SUBMITTED',
      resource: 'task_execution',
      resourceId: execution.id,
      description: `Task execution submitted for review`,
      metadata: {
        taskId: execution.taskId,
        submittedAt: new Date(),
        hasProof: !!proofUrl
      }
    });

    res.json({
      success: true,
      message: 'Task submitted successfully. Awaiting admin review.',
      execution: {
        id: execution.id,
        status: 'submitted',
        submittedAt: execution.submittedAt
      }
    });
  })
);

/**
 * Approve task execution (admin only)
 */
router.post('/executions/:id/approve',
  auth,
  requirePermission('tasks.edit'),
  param('id').isUUID(),
  body('adminNotes').optional().trim().escape(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { adminNotes = '' } = req.body;
    const transaction = await sequelize.transaction();

    try {
      const execution = await TaskExecution.findOne({
        where: { id, status: 'submitted' },
        attributes: ['id', 'taskId', 'userId', 'status'],
        include: [
          {
            model: Task,
            as: 'task',
            attributes: ['id', 'rate', 'completedQuantity', 'quantity', 'orderId', 'status']
          }
        ],
        transaction
      });

      if (!execution) {
        await transaction.rollback();
        return res.status(404).json({
          error: 'Execution not found or not in submitted status',
          code: 'EXECUTION_NOT_FOUND'
        });
      }

      const task = execution.task;
      const reward = parseFloat(task.rate);

      // Update execution status
      await execution.update({
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: req.user.id,
        adminNotes
      }, { transaction });

      // Increment task completed quantity
      await task.increment('completedQuantity', { by: 1, transaction });

      // Credit user balance
      await User.increment('balance', {
        by: reward,
        where: { id: execution.userId },
        transaction
      });

      // **PART 5: If task linked to order, update order progress**
      if (task.orderId) {
        await Order.increment('completedCount', {
          by: 1,
          where: { id: task.orderId },
          transaction
        });

        // Check if order is complete
        const order = await Order.findByPk(task.orderId, {
          attributes: ['id', 'completedCount', 'quantity', 'status'],
          transaction
        });

        if (order && order.completedCount >= order.quantity && order.status !== 'completed') {
          await order.update({ status: 'completed' }, { transaction });
        }
      }

      // **PART 5: If task fully completed, mark as completed**
      if (task.completedQuantity + 1 >= task.quantity) {
        await task.update({ status: 'completed' }, { transaction });
      }

      // Log audit
      await logAudit(req, {
        action: 'TASK_EXECUTION_APPROVED',
        resource: 'task_execution',
        resourceId: execution.id,
        targetUserId: execution.userId,
        description: `Task execution approved - User credited $${reward.toFixed(2)}`,
        metadata: {
          taskId: task.id,
          orderId: task.orderId,
          reward,
          adminNotes
        }
      });

      await transaction.commit();

      res.json({
        success: true,
        message: 'Task execution approved successfully',
        execution: {
          id: execution.id,
          status: 'approved',
          reward
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  })
);

/**
 * Reject task execution (admin only)
 */
router.post('/executions/:id/reject',
  auth,
  requirePermission('tasks.edit'),
  param('id').isUUID(),
  body('reason')
    .trim()
    .notEmpty().withMessage('Rejection reason is required')
    .isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
    .escape(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const transaction = await sequelize.transaction();

    try {
      const execution = await TaskExecution.findOne({
        where: { id, status: 'submitted' },
        attributes: ['id', 'taskId', 'userId', 'status'],
        transaction
      });

      if (!execution) {
        await transaction.rollback();
        return res.status(404).json({
          error: 'Execution not found or not in submitted status',
          code: 'EXECUTION_NOT_FOUND'
        });
      }

      // Update execution status
      await execution.update({
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: req.user.id,
        rejectionReason: reason
      }, { transaction });

      // Return slot to task
      await Task.increment('remainingQuantity', {
        by: 1,
        where: { id: execution.taskId },
        transaction
      });

      // Log audit
      await logAudit(req, {
        action: 'TASK_EXECUTION_REJECTED',
        resource: 'task_execution',
        resourceId: execution.id,
        targetUserId: execution.userId,
        description: `Task execution rejected: ${reason}`,
        metadata: {
          taskId: execution.taskId,
          reason
        }
      });

      await transaction.commit();

      res.json({
        success: true,
        message: 'Task execution rejected',
        execution: {
          id: execution.id,
          status: 'rejected',
          reason
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  })
);

/**
 * Get user's task executions
 */
router.get('/my-executions',
  auth,
  asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const where = { userId: req.user.id };

    if (status) {
      where.status = status;
    }

    const { rows: executions, count } = await TaskExecution.findAndCountAll({
      where,
      attributes: ['id', 'status', 'reservedAt', 'submittedAt', 'expiresAt', 'reviewedAt', 'rejectionReason'],
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'platform', 'rate', 'targetUrl']
        }
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      executions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  })
);

export default router;
