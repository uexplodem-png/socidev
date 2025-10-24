import express from 'express';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { User, Order, Task, Transaction, AuditLog, Withdrawal, Device, SocialAccount } from '../../models/index.js';
import { validate, schemas } from '../../middleware/validation.js';
import { asyncHandler, NotFoundError } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - username
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [task_doer, task_giver, admin, super_admin, moderator]
 *               status:
 *                 type: string
 *                 enum: [active, suspended, banned]
 *               balance:
 *                 type: number
 *                 minimum: 0
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
router.post('/',
  requirePermission('users.create'),
  validate(schemas.createUser),
  asyncHandler(async (req, res) => {
    const userData = req.body;
    
    // Generate a random password if not provided
    if (!userData.password) {
      userData.password = Math.random().toString(36).slice(-8);
    }

    // Create user
    const user = await User.create(userData);

    // Log the creation to AuditLog
    await AuditLog.log(
      req.user.id,
      'USER_CREATED',
      'user',
      user.id,
      user.id,
      `Created new user ${user.firstName} ${user.lastName}`,
      { userData },
      req
    );

    res.status(201).json({
      user: user.toJSON(),
    });
  })
);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with filtering and pagination
 *     tags: [Admin Users]
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
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin, super_admin, all]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, suspended, banned, all]
 *     responses:
 *       200:
 *         description: List of users with pagination
 */
router.get('/',
  requirePermission('users.view'),
  validate(schemas.userQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, search, role, status, sortBy, sortOrder } = req.query;

    // Build where clause
    const where = {};

    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
      ];
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch users with pagination
    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: { exclude: ['password', 'refresh_token'] },
    });

    res.json({
      users,
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
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details by ID
 *     tags: [Admin Users]
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
 *         description: User details with related data
 *       404:
 *         description: User not found
 */
router.get('/:id',
  requirePermission('users.view'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'refresh_token'] },
      include: [
        {
          model: Order,
          as: 'orders',
          limit: 10,
          order: [['created_at', 'DESC']],
          separate: true,
        },
        {
          model: Task,
          as: 'tasks',
          limit: 10,
          order: [['created_at', 'DESC']],
          separate: true,
        },
        {
          model: Transaction,
          as: 'transactions',
          limit: 10,
          order: [['created_at', 'DESC']],
          separate: true,
        },
        {
          model: Device,
          as: 'devices',
          limit: 10,
          order: [['created_at', 'DESC']],
          separate: true,
          required: false,
        },
        {
          model: SocialAccount,
          as: 'socialAccounts',
          limit: 10,
          order: [['created_at', 'DESC']],
          separate: true,
        },
      ],
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Fetch withdrawals separately (withdrawal-type transactions)
    const withdrawals = await Transaction.findAll({
      where: {
        user_id: id,
        type: 'withdrawal',
      },
      limit: 10,
      order: [['created_at', 'DESC']],
    });

    // Separate balance history (all transactions, not withdrawals)
    const balanceHistory = user.transactions || [];

    // Get user statistics and analytics
    const [totalOrders, totalSpent, totalEarned, completedTasks, totalWithdrawals, pendingWithdrawals] = await Promise.all([
      Order.count({ where: { user_id: id } }),
      Transaction.sum('amount', {
        where: {
          user_id: id,
          type: 'order_payment',
          status: 'completed',
        },
      }),
      Transaction.sum('amount', {
        where: {
          user_id: id,
          type: 'task_earning',
          status: 'completed',
        },
      }),
      Task.count({
        where: {
          user_id: id,
          status: 'completed',
        },
      }),
      Transaction.sum('amount', {
        where: {
          user_id: id,
          type: 'withdrawal',
          status: 'completed',
        },
      }),
      Transaction.count({
        where: {
          user_id: id,
          type: 'withdrawal',
          status: 'pending',
        },
      }),
    ]);

    // Get analytics data
    const analytics = {
      totalOrders,
      completedOrders: await Order.count({ where: { user_id: id, status: 'completed' } }),
      failedOrders: await Order.count({ where: { user_id: id, status: 'failed' } }),
      totalSpent: parseFloat(totalSpent) || 0,
      totalEarned: parseFloat(totalEarned) || 0,
      completedTasks,
      totalWithdrawals: parseFloat(totalWithdrawals) || 0,
      pendingWithdrawals,
    };

    // Organize user data by sections
    const userWithDetails = user.toJSON ? user.toJSON() : user;
    
    res.json({
      user: userWithDetails,
      sections: {
        overview: {
          user: userWithDetails,
          statistics: {
            totalOrders,
            totalSpent: parseFloat(totalSpent) || 0,
            totalEarned: parseFloat(totalEarned) || 0,
            completedTasks,
            totalWithdrawals: parseFloat(totalWithdrawals) || 0,
            pendingWithdrawals,
          },
        },
        orders: {
          data: user.orders || [],
          total: totalOrders,
        },
        balanceHistory: {
          data: balanceHistory,
          total: balanceHistory.length,
        },
        withdrawals: {
          data: withdrawals,
          total: await Transaction.count({ where: { user_id: id, type: 'withdrawal' } }),
          completed: await Transaction.count({ where: { user_id: id, type: 'withdrawal', status: 'completed' } }),
          pending: pendingWithdrawals,
        },
        socialMedia: {
          data: user.socialAccounts || [],
          total: await SocialAccount.count({ where: { user_id: id } }),
        },
        devices: {
          data: user.devices || [],
          total: await Device.count({ where: { user_id: id } }),
        },
        tasks: {
          data: user.tasks || [],
          total: await Task.count({ where: { user_id: id } }),
          completed: completedTasks,
        },
        analytics: {
          ...analytics,
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user information
 *     tags: [Admin Users]
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
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (optional)
 *               role:
 *                 type: string
 *                 enum: [user, admin, super_admin]
 *               status:
 *                 type: string
 *                 enum: [active, suspended, banned]
 *               balance:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.put('/:id',
  requirePermission('users.edit'),
  validate(schemas.updateUser),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    console.log('Received update request for user ID:', id);
    console.log('Update data:', updates);

    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Store original values for audit log - using model property names
    const originalValues = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      balance: user.balance,
      hasPassword: !!user.password,
    };

    console.log('Original user values:', originalValues);

    // Update user directly with the provided updates
    // Only include fields that are actually being updated
    const updateData = {};
    if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
    if (updates.lastName !== undefined) updateData.lastName = updates.lastName;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.balance !== undefined) updateData.balance = updates.balance;
    
    // Handle password separately - hash it if provided
    if (updates.password !== undefined) {
      updateData.password = await bcrypt.hash(updates.password, 10);
    }

    console.log('Update data to apply:', updateData);

    // Update user
    await user.update(updateData);

    console.log('Updated user:', user.toJSON());

    // Get the updated values after the update
    const updatedValues = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      balance: user.balance,
      hasPassword: !!user.password,
    };

    // Determine which fields changed
    const changedFields = Object.keys(updateData);

    // Log the update to AuditLog
    await AuditLog.log(
      req.user.id,
      'USER_UPDATED',
      'user',
      user.id,
      user.id,
      `Updated user ${user.firstName} ${user.lastName}`,
      {
        targetUserId: user.id,
        targetUserName: `${user.firstName} ${user.lastName}`,
        targetUserEmail: user.email,
        changes: {
          before: originalValues,
          after: updatedValues,
          fields: changedFields,
        },
      },
      req
    );

    res.json({
      user: user.toJSON(),
    });
  })
);

/**
 * @swagger
 * /api/admin/users/{id}/suspend:
 *   post:
 *     summary: Suspend user account
 *     tags: [Admin Users]
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
 *     responses:
 *       200:
 *         description: User suspended successfully
 *       404:
 *         description: User not found
 */
router.post('/:id/suspend',
  requirePermission('users.suspend'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    await user.update({ status: 'suspended' });

    // Log the suspension to AuditLog
    await AuditLog.log(
      req.user.id,
      'USER_SUSPENDED',
      'user',
      user.id,
      user.id,
      `Suspended user ${user.firstName} ${user.lastName}`,
      { reason },
      req
    );

    res.json({
      user: user.toJSON(),
      message: 'User suspended successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/users/{id}/activate:
 *   post:
 *     summary: Activate user account
 *     tags: [Admin Users]
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
 *         description: User activated successfully
 *       404:
 *         description: User not found
 */
router.post('/:id/activate',
  requirePermission('users.suspend'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    await user.update({ status: 'active' });

    // Log the activation to AuditLog
    await AuditLog.log(
      req.user.id,
      'USER_ACTIVATED',
      'user',
      user.id,
      user.id,
      `Activated user ${user.firstName} ${user.lastName}`,
      {},
      req
    );

    res.json({
      user: user.toJSON(),
      message: 'User activated successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/users/bulk-action:
 *   post:
 *     summary: Perform bulk actions on users
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - user_ids
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [ban, unban, suspend, activate, delete]
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Bulk action completed successfully
 */
router.post('/bulk-action',
  requirePermission('users.edit'),
  validate(schemas.bulkUserAction),
  asyncHandler(async (req, res) => {
    const { action, user_ids, reason } = req.body;

    const users = await User.findAll({
      where: { id: { [Op.in]: user_ids } },
    });

    if (users.length === 0) {
      return res.status(400).json({
        error: 'No valid users found',
        code: 'NO_USERS_FOUND',
      });
    }

    // Perform bulk action
    let updateData = {};
    let auditAction = '';

    switch (action) {
      case 'ban':
        updateData = { status: 'banned' };
        auditAction = 'USER_BANNED';
        break;
      case 'unban':
        updateData = { status: 'active' };
        auditAction = 'USER_UNBANNED';
        break;
      case 'suspend':
        updateData = { status: 'suspended' };
        auditAction = 'USER_SUSPENDED';
        break;
      case 'activate':
        updateData = { status: 'active' };
        auditAction = 'USER_ACTIVATED';
        break;
      case 'delete':
        // Soft delete by setting status to banned and anonymizing data
        updateData = { 
          status: 'banned',
          email: `deleted_${Date.now()}@deleted.com`,
          username: `deleted_${Date.now()}`,
        };
        auditAction = 'USER_DELETED';
        break;
    }

    // Update all users
    await User.update(updateData, {
      where: { id: { [Op.in]: user_ids } },
    });

    // Log bulk action for each user
    for (const user of users) {
      await AuditLog.log(
        req.user.id,
        auditAction,
        'user',
        user.id,
        user.id,
        `${auditAction.replace('_', ' ')} user ${user.firstName} ${user.lastName}`,
        { reason, bulkAction: true },
        req
      );
    }

    // Fetch updated users
    const updatedUsers = await User.findAll({
      where: { id: { [Op.in]: user_ids } },
      attributes: { exclude: ['password', 'refresh_token'] },
    });

    res.json({
      message: `Bulk ${action} completed successfully`,
      affectedUsers: updatedUsers.length,
      users: updatedUsers,
    });
  })
);

/**
 * @swagger
 * /api/admin/users/{id}/balance:
 *   post:
 *     summary: Adjust user balance
 *     tags: [Admin Users]
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
 *               - amount
 *               - type
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [add, subtract]
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Balance adjusted successfully
 *       404:
 *         description: User not found
 */
router.post('/:id/balance',
  requirePermission('users.edit'),
  validate(schemas.adjustBalance || Joi.object({
    amount: Joi.number().min(0.01).required(),
    type: Joi.string().valid('add', 'subtract').required(),
    reason: Joi.string().max(500).required(),
  })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, type, reason } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    const balanceBefore = parseFloat(user.balance);
    const adjustmentAmount = type === 'add' ? amount : -amount;
    const balanceAfter = balanceBefore + adjustmentAmount;

    if (balanceAfter < 0) {
      return res.status(400).json({
        error: 'Insufficient balance for subtraction',
        code: 'INSUFFICIENT_BALANCE',
      });
    }

    // Update user balance
    await user.update({ balance: balanceAfter });

    // Log the data we're trying to insert
    console.log('Creating transaction with data:', {
      userId: id,
      user_id: id,
      type: 'adjustment',
      amount: adjustmentAmount,
      status: 'completed',
      method: 'balance',
      description: `Admin balance adjustment: ${reason}`,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      processed_by: req.user.id,
      processed_at: new Date(),
    });

    // Create transaction record
    const transaction = await Transaction.create({
      userId: id,
      type: 'adjustment',
      amount: adjustmentAmount,
      status: 'completed',
      method: 'balance',
      description: `Admin balance adjustment: ${reason}`,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      processed_by: req.user.id,
      processed_at: new Date(),
    });

    // Log the balance adjustment to AuditLog
    await AuditLog.log(
      req.user.id,
      'BALANCE_ADJUSTED',
      'user',
      user.id,
      user.id,
      `Balance adjusted for user ${user.firstName} ${user.lastName}`,
      {
        amount: adjustmentAmount,
        balanceBefore,
        balanceAfter,
        reason,
      },
      req
    );

    res.json({
      user: user.toJSON(),
      transaction,
      message: `Balance ${type}ed successfully`,
    });
  })
);

/**
 * @swagger
 * /api/admin/users/{id}/transactions:
 *   get:
 *     summary: Get user transaction history
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: User transaction history
 *       404:
 *         description: User not found
 */
router.get('/:id/transactions',
  requirePermission('users.view'),
  validate(schemas.paginationQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit } = req.query;

    // Verify user exists
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    const offset = (page - 1) * limit;

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: { user_id: id },
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'service', 'target_url'],
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

export default router;