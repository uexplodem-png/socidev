/**
 * **PART 7: Admin Task Execution Routes**
 * Admin endpoints for managing task executions (submissions)
 */

import express from 'express';
import { TaskExecution, Task, User, Order } from '../../models/index.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import { logAudit } from '../../utils/logging.js';

const router = express.Router();
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * **PART 7: Get all task executions (admin)**
 * GET /admin/task-executions
 * Query params: status, page, limit, sortBy, order
 */
router.get('/',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { 
      status = 'submitted', 
      page = 1, 
      limit = 20,
      sortBy = 'submittedAt',
      order = 'DESC'
    } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const sortField = sortBy === 'submittedAt' ? 'submitted_at' : 'created_at';

    const { rows: executions, count } = await TaskExecution.findAndCountAll({
      where,
      attributes: [
        'id', 'taskId', 'userId', 'status', 
        'proofUrl', 'submissionNotes', 'adminNotes', 'rejectionReason',
        'reservedAt', 'submittedAt', 'expiresAt', 'reviewedAt', 
        'createdAt', 'updatedAt'
      ],
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'platform', 'type', 'rate', 'targetUrl', 'orderId'],
          include: [
            {
              model: Order,
              as: 'order',
              attributes: ['id', 'userId', 'platform', 'service', 'quantity', 'completedCount', 'status']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'balance']
        }
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [[sortField, order.toUpperCase()]]
    });

    // Map to frontend-friendly format
    const mapped = executions.map(exec => {
      const task = exec.task || {};
      const user = exec.user || {};
      const order = task.order || {};

      return {
        id: exec.id,
        taskId: exec.taskId,
        taskTitle: task.title,
        userId: exec.userId,
        userName: `${user.firstName} ${user.lastName}`.trim(),
        userEmail: user.email,
        userBalance: user.balance,
        platform: task.platform,
        taskType: task.type,
        rate: task.rate,
        targetUrl: task.targetUrl,
        orderId: task.orderId,
        orderStatus: order.status,
        proofUrl: exec.proofUrl,
        submissionNotes: exec.submissionNotes,
        adminNotes: exec.adminNotes,
        rejectionReason: exec.rejectionReason,
        status: exec.status,
        reservedAt: exec.reservedAt,
        submittedAt: exec.submittedAt,
        expiresAt: exec.expiresAt,
        reviewedAt: exec.reviewedAt,
        createdAt: exec.createdAt,
        updatedAt: exec.updatedAt
      };
    });

    res.json({
      executions: mapped,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  })
);

/**
 * **PART 7: Approve task execution**
 * POST /admin/executions/:id/approve
 */
router.post('/:id/approve',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;

    const execution = await TaskExecution.findByPk(id, {
      attributes: ['id', 'taskId', 'userId', 'status', 'submissionNotes'],
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'rate', 'completedQuantity', 'quantity', 'orderId'],
          include: [
            {
              model: Order,
              as: 'order',
              attributes: ['id', 'completedCount', 'quantity', 'status']
            }
          ]
        }
      ]
    });

    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    if (execution.status !== 'submitted') {
      return res.status(400).json({ error: 'Only submitted executions can be approved' });
    }

    const transaction = await execution.sequelize.transaction();

    try {
      // Update execution status
      await execution.update({
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: req.user.id,
        adminNotes: notes
      }, { transaction });

      // Credit user balance
      const rate = parseFloat(execution.task.rate);
      await User.increment('balance', {
        by: rate,
        where: { id: execution.userId },
        transaction
      });

      // Increment task completed quantity
      await Task.increment('completedQuantity', {
        by: 1,
        where: { id: execution.taskId },
        transaction
      });

      // Increment order completed count if task is linked to order
      if (execution.task.orderId) {
        await Order.increment('completedCount', {
          by: 1,
          where: { id: execution.task.orderId },
          transaction
        });

        // Check if order is now complete
        const order = execution.task.order;
        if (order && (order.completedCount + 1) >= order.quantity) {
          await Order.update(
            { status: 'completed' },
            { where: { id: order.id }, transaction }
          );
        }
      }

      // Audit log
      await logAudit({
        actor_id: req.user.id,
        action: 'task_execution_approved',
        resource: 'task_execution',
        resource_id: execution.id,
        target_user_id: execution.userId,
        description: `Approved task execution #${execution.id.substring(0, 8)}, credited $${rate.toFixed(2)}`,
        metadata: { executionId: execution.id, taskId: execution.taskId, reward: rate, notes },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        transaction
      });

      await transaction.commit();

      res.json({ 
        success: true, 
        message: 'Task execution approved',
        reward: rate 
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  })
);

/**
 * **PART 7: Reject task execution**
 * POST /admin/executions/:id/reject
 */
router.post('/:id/reject',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason, notes } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const execution = await TaskExecution.findByPk(id, {
      attributes: ['id', 'taskId', 'userId', 'status']
    });

    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    if (execution.status !== 'submitted') {
      return res.status(400).json({ error: 'Only submitted executions can be rejected' });
    }

    const transaction = await execution.sequelize.transaction();

    try {
      // Update execution status
      await execution.update({
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: req.user.id,
        rejectionReason: reason,
        adminNotes: notes
      }, { transaction });

      // Return slot to task (increment remaining quantity)
      await Task.increment('remainingQuantity', {
        by: 1,
        where: { id: execution.taskId },
        transaction
      });

      // Audit log
      await logAudit({
        actor_id: req.user.id,
        action: 'task_execution_rejected',
        resource: 'task_execution',
        resource_id: execution.id,
        target_user_id: execution.userId,
        description: `Rejected task execution #${execution.id.substring(0, 8)}: ${reason}`,
        metadata: { executionId: execution.id, taskId: execution.taskId, reason, notes },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        transaction
      });

      await transaction.commit();

      res.json({ 
        success: true, 
        message: 'Task execution rejected',
        reason 
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  })
);

export default router;
