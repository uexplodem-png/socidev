import { Op } from 'sequelize';
import { User, Order, Task, Transaction } from '../models/index.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';

export class UserService {
  /**
   * Get users with filtering and pagination
   */
  static async getUsers(filters = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filters;

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

    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: { exclude: ['password', 'refresh_token'] },
    });

    return {
      users,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get user by ID with related data
   */
  static async getUserById(id, includeRelated = true) {
    const includeOptions = includeRelated ? [
      {
        model: Order,
        as: 'orders',
        limit: 10,
        order: [['created_at', 'DESC']],
      },
      {
        model: Task,
        as: 'tasks',
        limit: 10,
        order: [['created_at', 'DESC']],
      },
      {
        model: Transaction,
        as: 'transactions',
        limit: 10,
        order: [['created_at', 'DESC']],
      },
    ] : [];

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'refresh_token'] },
      include: includeOptions,
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    if (includeRelated) {
      // Get user statistics
      const [totalOrders, totalSpent, totalEarned, completedTasks] = await Promise.all([
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
      ]);

      return {
        user,
        statistics: {
          totalOrders,
          totalSpent: parseFloat(totalSpent) || 0,
          totalEarned: parseFloat(totalEarned) || 0,
          completedTasks,
        },
      };
    }

    return { user };
  }

  /**
   * Update user information
   */
  static async updateUser(id, updates, adminId) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Validate unique constraints
    if (updates.email && updates.email !== user.email) {
      const existingUser = await User.findOne({ where: { email: updates.email } });
      if (existingUser) {
        throw new ValidationError('Email already exists');
      }
    }

    if (updates.username && updates.username !== user.username) {
      const existingUser = await User.findOne({ where: { username: updates.username } });
      if (existingUser) {
        throw new ValidationError('Username already exists');
      }
    }

    // Store original values for audit
    const originalValues = {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      balance: user.balance,
    };

    await user.update(updates);

    return {
      user,
      originalValues,
    };
  }

  /**
   * Adjust user balance
   */
  static async adjustBalance(userId, amount, type, reason, adminId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const balanceBefore = parseFloat(user.balance);
    const adjustmentAmount = type === 'add' ? Math.abs(amount) : -Math.abs(amount);
    const balanceAfter = balanceBefore + adjustmentAmount;

    if (balanceAfter < 0) {
      throw new ValidationError('Insufficient balance for subtraction');
    }

    // Update user balance
    await user.update({ balance: balanceAfter });

    // Create transaction record
    const transaction = await Transaction.create({
      user_id: userId,
      type: 'adjustment',
      amount: adjustmentAmount,
      status: 'completed',
      method: 'balance',
      description: `Admin balance adjustment: ${reason}`,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      processed_by: adminId,
      processed_at: new Date(),
    });

    return {
      user,
      transaction,
      balanceBefore,
      balanceAfter,
    };
  }

  /**
   * Get user statistics
   */
  static async getUserStatistics(timeRange = '30d') {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const dateFilter = {
      created_at: {
        [Op.gte]: startDate,
      },
    };

    const [
      totalUsers,
      activeUsers,
      newUsers,
      suspendedUsers,
      bannedUsers,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { status: 'active' } }),
      User.count({ where: dateFilter }),
      User.count({ where: { status: 'suspended' } }),
      User.count({ where: { status: 'banned' } }),
    ]);

    // Get user registration trend
    const registrationTrend = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const dayUsers = await User.count({
        where: {
          created_at: {
            [Op.between]: [date, nextDate],
          },
        },
      });
      
      registrationTrend.push({
        date: date.toISOString().split('T')[0],
        users: dayUsers,
      });
    }

    return {
      summary: {
        totalUsers,
        activeUsers,
        newUsers,
        suspendedUsers,
        bannedUsers,
      },
      trend: registrationTrend,
    };
  }

  /**
   * Bulk update users
   */
  static async bulkUpdateUsers(userIds, action, reason, adminId) {
    const users = await User.findAll({
      where: { id: { [Op.in]: userIds } },
    });

    if (users.length === 0) {
      throw new ValidationError('No valid users found');
    }

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
        // Soft delete by anonymizing data
        updateData = { 
          status: 'banned',
          email: `deleted_${Date.now()}@deleted.com`,
          username: `deleted_${Date.now()}`,
          first_name: 'Deleted',
          last_name: 'User',
        };
        auditAction = 'USER_DELETED';
        break;
      default:
        throw new ValidationError('Invalid bulk action');
    }

    // Update all users
    await User.update(updateData, {
      where: { id: { [Op.in]: userIds } },
    });

    return {
      affectedUsers: users.length,
      action: auditAction,
      users,
    };
  }
}

export default UserService;