import express from 'express';
import { Op } from 'sequelize';
import { Withdrawal, User, Transaction, ActivityLog } from '../../models/index.js';
import { validate, schemas } from '../../middleware/validation.js';
import { asyncHandler, NotFoundError } from '../../middleware/errorHandler.js';
import { requirePermission, authorizeRoles, requireAdminPermission } from '../../middleware/auth.js';
import Joi from 'joi';

const router = express.Router();

/**
 * @swagger
 * /api/admin/withdrawals:
 *   get:
 *     summary: Get all withdrawal requests with filtering and pagination
 *     tags: [Admin Withdrawals]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled, all]
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [bank_transfer, crypto, paypal, all]
 *     responses:
 *       200:
 *         description: List of withdrawal requests with pagination
 */
router.get('/',
  requirePermission('withdrawals.view'),
  validate(Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(255).optional(),
    status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'cancelled', 'all').default('all'),
    method: Joi.string().valid('bank_transfer', 'crypto', 'paypal', 'all').default('all'),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'amount').default('created_at'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }), 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, search, status, method, sortBy, sortOrder } = req.query;

    // Build where clause
    const where = {};

    if (search) {
      where[Op.or] = [
        { '$user.first_name$': { [Op.like]: `%${search}%` } },
        { '$user.last_name$': { [Op.like]: `%${search}%` } },
        { '$user.email$': { [Op.like]: `%${search}%` } },
        { transaction_id: { [Op.like]: `%${search}%` } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (method && method !== 'all') {
      where.method = method;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch withdrawals with pagination
    const { count, rows: withdrawals } = await Withdrawal.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'username', 'balance'],
        },
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false,
        },
      ],
    });

    res.json({
      withdrawals,
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
 * /api/admin/withdrawals/{id}:
 *   get:
 *     summary: Get withdrawal details by ID
 *     tags: [Admin Withdrawals]
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
 *         description: Withdrawal details
 *       404:
 *         description: Withdrawal not found
 */
router.get('/:id',
  requirePermission('withdrawals.view'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const withdrawal = await Withdrawal.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'username', 'balance'],
        },
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false,
        },
      ],
    });

    if (!withdrawal) {
      throw new NotFoundError('Withdrawal');
    }

    res.json({
      withdrawal,
    });
  })
);

/**
 * @swagger
 * /api/admin/withdrawals/{id}/status:
 *   post:
 *     summary: Update withdrawal status
 *     tags: [Admin Withdrawals]
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
 *                 enum: [processing, completed, failed, cancelled]
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *               transaction_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Withdrawal status updated successfully
 *       404:
 *         description: Withdrawal not found
 *       400:
 *         description: Invalid status transition
 */
router.post('/:id/status',
  requireAdminPermission('withdrawals.approve'), // Dynamic permission check from database
  validate(schemas.updateWithdrawalStatus),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes, transaction_id } = req.body;

    const withdrawal = await Withdrawal.findByPk(id, {
      include: [{ model: User, as: 'user' }],
    });

    if (!withdrawal) {
      throw new NotFoundError('Withdrawal');
    }

    // Validate status transition
    const validTransitions = {
      pending: ['processing', 'failed', 'cancelled'],
      processing: ['completed', 'failed', 'cancelled'],
    };

    if (!validTransitions[withdrawal.status]?.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status transition',
        code: 'INVALID_STATUS_TRANSITION',
        currentStatus: withdrawal.status,
        requestedStatus: status,
      });
    }

    const originalStatus = withdrawal.status;

    // Update withdrawal
    await withdrawal.update({
      status,
      notes: notes || withdrawal.notes,
      transaction_id: transaction_id || withdrawal.transaction_id,
      processed_by: req.user.id,
      processed_at: new Date(),
    });

    // Handle balance adjustments for failed/cancelled withdrawals
    if (['failed', 'cancelled'].includes(status) && originalStatus === 'processing') {
      // Return money to user balance
      const user = withdrawal.user;
      const newBalance = parseFloat(user.balance) + parseFloat(withdrawal.amount);
      await user.update({ balance: newBalance });

      // Create reversal transaction
      await Transaction.create({
        user_id: withdrawal.user_id,
        type: 'deposit',
        amount: withdrawal.amount,
        status: 'completed',
        method: 'balance',
        description: `Withdrawal ${status} - funds returned`,
        balance_before: parseFloat(user.balance),
        balance_after: newBalance,
        processed_by: req.user.id,
        processed_at: new Date(),
        details: {
          withdrawal_id: withdrawal.id,
          reason: notes,
        },
      });
    }

    // Log status change
    await ActivityLog.log(
      req.user.id,
      'WITHDRAWAL_STATUS_UPDATED',
      'withdrawal',
      id,
      withdrawal.user_id,
      `Withdrawal status changed from ${originalStatus} to ${status}`,
      {
        originalStatus,
        newStatus: status,
        amount: withdrawal.amount,
        method: withdrawal.method,
        notes,
        transaction_id,
      },
      req
    );

    res.json({
      withdrawal,
      message: 'Withdrawal status updated successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/withdrawals/stats:
 *   get:
 *     summary: Get withdrawal statistics
 *     tags: [Admin Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Withdrawal statistics
 */
router.get('/stats',
  requirePermission('withdrawals.view'),
  validate(schemas.dashboardStatsQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { timeRange } = req.query;

    // Calculate date range
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const dateFilter = {
      created_at: {
        [Op.gte]: startDate,
      },
    };

    // Get withdrawal statistics
    const [
      totalWithdrawals,
      pendingWithdrawals,
      processingWithdrawals,
      completedWithdrawals,
      failedWithdrawals,
      totalAmount,
      pendingAmount,
      completedAmount,
    ] = await Promise.all([
      Withdrawal.count({ where: dateFilter }),
      Withdrawal.count({ where: { ...dateFilter, status: 'pending' } }),
      Withdrawal.count({ where: { ...dateFilter, status: 'processing' } }),
      Withdrawal.count({ where: { ...dateFilter, status: 'completed' } }),
      Withdrawal.count({ where: { ...dateFilter, status: 'failed' } }),
      Withdrawal.sum('amount', { where: dateFilter }),
      Withdrawal.sum('amount', { where: { ...dateFilter, status: 'pending' } }),
      Withdrawal.sum('amount', { where: { ...dateFilter, status: 'completed' } }),
    ]);

    // Get withdrawal breakdown by method
    const withdrawalsByMethod = await Withdrawal.findAll({
      where: { ...dateFilter, status: 'completed' },
      attributes: [
        'method',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
      ],
      group: ['method'],
      raw: true,
    });

    res.json({
      summary: {
        totalWithdrawals,
        pendingWithdrawals,
        processingWithdrawals,
        completedWithdrawals,
        failedWithdrawals,
        totalAmount: parseFloat(totalAmount) || 0,
        pendingAmount: parseFloat(pendingAmount) || 0,
        completedAmount: parseFloat(completedAmount) || 0,
      },
      breakdown: withdrawalsByMethod,
      period: timeRange,
    });
  })
);

/**
 * @swagger
 * /api/admin/withdrawals/bulk-process:
 *   post:
 *     summary: Bulk process withdrawal requests
 *     tags: [Admin Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - withdrawal_ids
 *               - action
 *             properties:
 *               withdrawal_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               action:
 *                 type: string
 *                 enum: [approve, reject, complete]
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Withdrawals processed successfully
 */
router.post('/bulk-process',
  requireAdminPermission('withdrawals.approve'), // Dynamic permission check from database
  validate(Joi.object({
    withdrawal_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
    action: Joi.string().valid('approve', 'reject', 'complete').required(),
    notes: Joi.string().max(500).optional(),
  })),
  asyncHandler(async (req, res) => {
    const { withdrawal_ids, action, notes } = req.body;

    const withdrawals = await Withdrawal.findAll({
      where: { id: { [Op.in]: withdrawal_ids } },
      include: [{ model: User, as: 'user' }],
    });

    if (withdrawals.length === 0) {
      return res.status(400).json({
        error: 'No valid withdrawals found',
        code: 'NO_WITHDRAWALS_FOUND',
      });
    }

    const processedWithdrawals = [];

    for (const withdrawal of withdrawals) {
      let newStatus;
      let auditAction;

      switch (action) {
        case 'approve':
          if (withdrawal.status === 'pending') {
            newStatus = 'processing';
            auditAction = 'WITHDRAWAL_APPROVED';
          }
          break;
        case 'reject':
          if (['pending', 'processing'].includes(withdrawal.status)) {
            newStatus = 'failed';
            auditAction = 'WITHDRAWAL_REJECTED';
            
            // Return funds to user balance
            const user = withdrawal.user;
            const newBalance = parseFloat(user.balance) + parseFloat(withdrawal.amount);
            await user.update({ balance: newBalance });
          }
          break;
        case 'complete':
          if (withdrawal.status === 'processing') {
            newStatus = 'completed';
            auditAction = 'WITHDRAWAL_COMPLETED';
          }
          break;
      }

      if (newStatus) {
        await withdrawal.update({
          status: newStatus,
          processed_by: req.user.id,
          processed_at: new Date(),
          notes: notes || withdrawal.notes,
          rejection_reason: action === 'reject' ? notes : withdrawal.rejection_reason,
        });

        processedWithdrawals.push(withdrawal);

        // Log the action
        await ActivityLog.log(
          req.user.id,
          auditAction,
          'withdrawal',
          withdrawal.id,
          withdrawal.user_id,
          `Withdrawal ${action}ed via bulk action - Amount: $${withdrawal.amount}`,
          {
            bulkAction: true,
            action,
            amount: withdrawal.amount,
            method: withdrawal.method,
            notes,
          },
          req
        );
      }
    }

    res.json({
      processedWithdrawals,
      message: `${processedWithdrawals.length} withdrawal(s) ${action}ed successfully`,
    });
  })
);

export default router;