import express from 'express';
import { Op } from 'sequelize';
import { Transaction, User, Order, AuditLog } from '../../models/index.js';
import { validate, schemas } from '../../middleware/validation.js';
import { asyncHandler, NotFoundError } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import { settingsService } from '../../services/settingsService.js';
import { logAudit } from '../../utils/logging.js';

const router = express.Router();

/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     summary: Get all transactions with filtering and pagination
 *     tags: [Admin Transactions]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [deposit, withdrawal, order_payment, task_earning, refund, adjustment, all]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled, all]
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [bank_transfer, credit_card, crypto, balance, paypal, all]
 *     responses:
 *       200:
 *         description: List of transactions with pagination
 */
router.get('/',
  requirePermission('transactions.view'),
  validate(schemas.transactionQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, search, type, status, method, sortBy, sortOrder } = req.query;

    // Build where clause
    const where = {};

    if (search) {
      // Join with User to search by user details
      const userWhere = {
        [Op.or]: [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ],
      };

      where[Op.or] = [
        { reference: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { '$user.first_name$': { [Op.like]: `%${search}%` } },
        { '$user.last_name$': { [Op.like]: `%${search}%` } },
        { '$user.email$': { [Op.like]: `%${search}%` } },
      ];
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (method && method !== 'all') {
      where.method = method;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch transactions with pagination
    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where,
      attributes: ['id', 'userId', 'orderId', 'type', 'amount', 'status', 'method', 'description', 'reference', 'balanceBefore', 'balanceAfter', 'createdAt', 'processedAt', 'processedBy'],
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
          model: Order,
          as: 'order',
          attributes: ['id', 'service', 'targetUrl', 'platform'],
          required: false,
        },
      ],
    });

    res.json({
      transactions,
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
 * /api/admin/transactions/{id}:
 *   get:
 *     summary: Get transaction details by ID
 *     tags: [Admin Transactions]
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
 *         description: Transaction details
 *       404:
 *         description: Transaction not found
 */
router.get('/:id',
  requirePermission('transactions.view'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const transaction = await Transaction.findByPk(id, {
      attributes: ['id', 'userId', 'orderId', 'type', 'amount', 'status', 'method', 'description', 'reference', 'balanceBefore', 'balanceAfter', 'notes', 'createdAt', 'processedAt', 'processedBy'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'username'],
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'service', 'targetUrl', 'platform', 'quantity', 'status'],
          required: false,
        },
      ],
    });

    if (!transaction) {
      throw new NotFoundError('Transaction');
    }

    res.json({
      transaction,
    });
  })
);

/**
 * @swagger
 * /api/admin/transactions:
 *   post:
 *     summary: Create a manual transaction (admin only)
 *     tags: [Admin Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTransaction'
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 */
router.post('/',
  requirePermission('transactions.create'),
  validate(schemas.createTransaction),
  asyncHandler(async (req, res) => {
    const transactionData = req.body;

    // Check if manual transaction creation is enabled
    const features = await settingsService.get('features.transactions', {});
    if (features.createEnabled === false) {
      return res.status(403).json({
        error: 'Manual transaction creation is currently disabled',
        code: 'FEATURE_DISABLED',
      });
    }

    // Verify user exists
    const user = await User.findByPk(transactionData.user_id, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'balance'],
    });
    if (!user) {
      throw new NotFoundError('User');
    }

    // Calculate balance changes for balance-affecting transactions
    let balanceBefore = parseFloat(user.balance);
    let balanceAfter = balanceBefore;
    let status = transactionData.status || 'pending';

    if (['deposit', 'task_earning', 'refund'].includes(transactionData.type)) {
      // Deposits stay pending until approved, then balance is added
      status = 'pending';
    } else if (['withdrawal', 'order_payment'].includes(transactionData.type)) {
      // Withdrawals deduct balance immediately and stay pending for approval
      status = 'pending';
      balanceAfter = balanceBefore - Math.abs(transactionData.amount);
      
      if (balanceAfter < 0) {
        return res.status(400).json({
          error: 'Insufficient balance',
          code: 'INSUFFICIENT_BALANCE',
          currentBalance: balanceBefore,
          requiredAmount: Math.abs(transactionData.amount),
        });
      }
    }

    // Create transaction
    const transaction = await Transaction.create({
      ...transactionData,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      status,
      processed_by: null,
      processed_at: null,
    });

    // Update user balance immediately only for withdrawals (they get refunded if rejected)
    if (['withdrawal', 'order_payment'].includes(transactionData.type) && balanceAfter !== balanceBefore) {
      await user.update({ balance: balanceAfter });
    }

    // Log transaction creation
    await logAudit(req, {
      action: 'TRANSACTION_CREATED',
      resource: 'transaction',
      resourceId: transaction.id,
      targetUserId: user.id,
      targetUserName: `${user.firstName} ${user.lastName}`,
      description: `Manual transaction created - ${transactionData.type}: $${Math.abs(transactionData.amount)}`,
      metadata: {
        transactionType: transactionData.type,
        amount: transactionData.amount,
        method: transactionData.method,
        balanceBefore,
        balanceAfter,
        status,
      }
    });

    res.status(201).json({
      transaction,
      message: 'Transaction created successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/transactions/stats:
 *   get:
 *     summary: Get transaction statistics
 *     tags: [Admin Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, custom]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Transaction statistics
 */
router.get('/stats',
  requirePermission('transactions.view'),
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

    // Get transaction statistics (using raw queries)
    const [
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      failedTransactions,
      totalVolume,
      depositVolume,
      withdrawalVolume,
      orderPaymentVolume,
    ] = await Promise.all([
      Transaction.count({ where: dateFilter }),
      Transaction.count({ where: { ...dateFilter, status: 'completed' } }),
      Transaction.count({ where: { ...dateFilter, status: 'pending' } }),
      Transaction.count({ where: { ...dateFilter, status: 'failed' } }),
      Transaction.findOne({
        where: { ...dateFilter, status: 'completed' },
        attributes: [[Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']],
        raw: true,
      }).then(result => parseFloat(result?.total) || 0),
      Transaction.findOne({
        where: { ...dateFilter, type: 'deposit', status: 'completed' },
        attributes: [[Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']],
        raw: true,
      }).then(result => parseFloat(result?.total) || 0),
      Transaction.findOne({
        where: { ...dateFilter, type: 'withdrawal', status: 'completed' },
        attributes: [[Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']],
        raw: true,
      }).then(result => Math.abs(parseFloat(result?.total)) || 0),
      Transaction.findOne({
        where: { ...dateFilter, type: 'order_payment', status: 'completed' },
        attributes: [[Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']],
        raw: true,
      }).then(result => Math.abs(parseFloat(result?.total)) || 0),
    ]);

    // Get transaction breakdown by type
    const transactionsByType = await Transaction.findAll({
      where: { ...dateFilter, status: 'completed' },
      attributes: [
        'type',
        [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'count'],
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total_amount'],
      ],
      group: ['type'],
      raw: true,
    });

    res.json({
      summary: {
        totalTransactions,
        completedTransactions,
        pendingTransactions,
        failedTransactions,
        totalVolume,
        depositVolume,
        withdrawalVolume,
        orderPaymentVolume,
      },
      breakdown: transactionsByType,
      period: timeRange,
    });
  })
);

/**
 * @swagger
 * /api/admin/transactions/{id}/approve:
 *   post:
 *     summary: Approve a pending transaction (withdrawal or deposit)
 *     tags: [Admin Transactions]
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction approved successfully
 *       404:
 *         description: Transaction not found
 */
router.post('/:id/approve',
  requirePermission('transactions.approve'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;

    // Check if transaction approvals are enabled
    const features = await settingsService.get('features.transactions', {});
    if (features.approveEnabled === false) {
      return res.status(403).json({
        error: 'Transaction approval is currently disabled',
        code: 'FEATURE_DISABLED',
      });
    }

    const transaction = await Transaction.findByPk(id, {
      attributes: ['id', 'userId', 'type', 'amount', 'status', 'method', 'description', 'balanceBefore', 'balanceAfter'],
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'balance'] }],
    });

    if (!transaction) {
      throw new NotFoundError('Transaction');
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        error: 'Only pending transactions can be approved',
        code: 'INVALID_TRANSACTION_STATUS',
        currentStatus: transaction.status,
      });
    }

    // Get user's balance before processing
    const balanceBefore = transaction.user ? Number(transaction.user.balance) : null;
    let balanceAfter = balanceBefore;

    // If it's a deposit, add the amount to user balance
    if (transaction.type === 'deposit' && transaction.user) {
      const user = transaction.user;
      const depositAmount = Math.abs(transaction.amount);
      balanceAfter = balanceBefore + depositAmount;
      await user.update({ balance: balanceAfter });
    }

    // Update transaction status to completed with balance tracking
    await transaction.update({
      status: 'completed',
      processed_by: req.user.id,
      processed_at: new Date(),
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: notes ? `${transaction.description} - Approved: ${notes}` : transaction.description,
      notes: notes,
    });

    // Log the approval action
    await logAudit(req, {
      action: 'TRANSACTION_APPROVED',
      resource: 'transaction',
      resourceId: transaction.id,
      targetUserId: transaction.userId,
      targetUserName: transaction.user ? `${transaction.user.firstName} ${transaction.user.lastName}` : null,
      description: `Approved ${transaction.type} transaction for $${Math.abs(transaction.amount)} via ${transaction.method}`,
      metadata: {
        status: 'completed',
        type: transaction.type,
        amount: transaction.amount,
        method: transaction.method,
        notes: notes || '',
      }
    });

    res.json({
      transaction,
      message: 'Transaction approved successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/transactions/{id}/reject:
 *   post:
 *     summary: Reject a pending transaction (withdrawal or deposit)
 *     tags: [Admin Transactions]
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction rejected successfully
 *       404:
 *         description: Transaction not found
 */
router.post('/:id/reject',
  requirePermission('transactions.reject'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;

    // Check if transaction rejections are enabled
    const features = await settingsService.get('features.transactions', {});
    if (features.rejectEnabled === false) {
      return res.status(403).json({
        error: 'Transaction rejection is currently disabled',
        code: 'FEATURE_DISABLED',
      });
    }

    const transaction = await Transaction.findByPk(id, {
      attributes: ['id', 'userId', 'type', 'amount', 'status', 'method', 'description', 'balanceBefore', 'balanceAfter', 'notes'],
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'balance'] }],
    });

    if (!transaction) {
      throw new NotFoundError('Transaction');
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        error: 'Only pending transactions can be rejected',
        code: 'INVALID_TRANSACTION_STATUS',
        currentStatus: transaction.status,
      });
    }

    // Get user's balance before processing
    const balanceBefore = transaction.user ? Number(transaction.user.balance) : null;
    let balanceAfter = balanceBefore;

    // If it's a withdrawal or deposit, handle refund/cancellation
    if (transaction.user) {
      const user = transaction.user;
      if (transaction.type === 'withdrawal') {
        // Refund withdrawal amount to balance
        const refundAmount = Math.abs(transaction.amount);
        balanceAfter = balanceBefore + refundAmount;
        await user.update({ balance: balanceAfter });
      } else if (transaction.type === 'deposit') {
        // Deposit was rejected - no balance change needed (was never added)
        balanceAfter = balanceBefore;
      }
    }

    // Update transaction status to failed with balance tracking
    await transaction.update({
      status: 'failed',
      processed_by: req.user.id,
      processed_at: new Date(),
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: notes ? `${transaction.description} - Rejected: ${notes}` : transaction.description,
      notes: notes,
    });

    // Log the rejection action
    await logAudit(req, {
      action: 'TRANSACTION_REJECTED',
      resource: 'transaction',
      resourceId: transaction.id,
      targetUserId: transaction.userId,
      targetUserName: transaction.user ? `${transaction.user.firstName} ${transaction.user.lastName}` : null,
      description: `Rejected ${transaction.type} transaction for $${Math.abs(transaction.amount)} via ${transaction.method}${transaction.type === 'withdrawal' ? ' - Amount refunded to user' : ''}`,
      metadata: {
        status: 'failed',
        type: transaction.type,
        amount: transaction.amount,
        method: transaction.method,
        notes: notes || '',
        refunded: transaction.type === 'withdrawal',
      }
    });

    res.json({
      transaction,
      message: 'Transaction rejected successfully',
    });
  })
);

export default router;