import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Task from '../models/Task.js';
import TaskExecution from '../models/TaskExecution.js';
import Device from '../models/Device.js';
import Transaction from '../models/Transaction.js';
import { ApiError } from '../utils/ApiError.js';
import { Op, fn, col } from 'sequelize';
import { sequelize } from '../config/database.js';

export class UserService {
  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'username', 'phone', 'balance', 'userMode', 'createdAt', 'lastLogin']
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return user;
  }

  async updateProfile(userId, updateData) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'username', 'phone']
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Only allow updating specific fields
    const allowedFields = ['firstName', 'lastName', 'phone'];
    const updates = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });

    await user.update(updates);
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      phone: user.phone
    };
  }

  async updatePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'password']
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await user.update({ password: hashedPassword });
  }

  async updateUserMode(userId, userMode) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'userMode']
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    await user.update({ userMode });
    
    return {
      id: user.id,
      userMode: user.userMode
    };
  }

  async getSettings(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['id']
      });
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Return default settings since user_settings table might not exist
      // This can be enhanced later with a proper UserSettings model
      return {
        notifications: {
          email: true,
          browser: true
        },
        privacy: {
          hideProfile: false,
          hideStats: false
        },
        language: 'en'
      };
    } catch (error) {
      // If settings column doesn't exist, return defaults
      if (error.name === 'SequelizeDatabaseError') {
        return {
          notifications: {
            email: true,
            browser: true
          },
          privacy: {
            hideProfile: false,
            hideStats: false
          },
          language: 'en'
        };
      }
      throw error;
    }
  }

  async updateSettings(userId, settings) {
    const user = await User.findByPk(userId, {
      attributes: ['id']
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // TODO: Implement proper settings storage when UserSettings table is created
    // For now, just return the settings as confirmation
    return settings;
  }

  async getDashboardStats(userId, timeframe = '30d') {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'balance', 'userMode']
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Common stats for both modes
    const balance = parseFloat(user.balance) || 0;

    if (user.userMode === 'taskDoer') {
      // Task Doer specific stats
      
      // Get active devices count
      const activeDevices = await Device.count({
        where: {
          user_id: userId,
          status: 'active'
        }
      });

      // Get completed tasks count
      const completedTasks = await TaskExecution.count({
        where: {
          userId: userId,
          status: 'completed',
          createdAt: { [Op.gte]: startDate }
        }
      });

      // Get total completed tasks (all time)
      const totalCompletedTasks = await TaskExecution.count({
        where: {
          userId: userId,
          status: 'completed'
        }
      });

      // Get total earnings
      const earningsResult = await Transaction.findOne({
        where: {
          userId: userId,
          type: 'task_earning',
          status: 'completed',
          createdAt: { [Op.gte]: startDate }
        },
        attributes: [
          [fn('SUM', col('amount')), 'totalEarnings']
        ]
      });
      const totalEarned = parseFloat(earningsResult?.dataValues?.totalEarnings) || 0;

      // Get in-progress tasks
      const inProgressTasks = await TaskExecution.count({
        where: {
          userId: userId,
          status: 'in_progress'
        }
      });

      // Platform-specific stats
      const platformStats = await Promise.all(
        ['instagram', 'youtube'].map(async (platform) => {
          // Optimize: Single query for completed tasks count by platform
          const platformCompletedTasks = await TaskExecution.count({
            where: {
              userId: userId,
              status: 'completed',
              createdAt: { [Op.gte]: startDate }
            },
            include: [{
              model: Task,
              as: 'task',
              where: { platform },
              attributes: [],
              required: true
            }]
          });

          // Optimize: Single aggregate query for earnings by platform  
          const platformEarningsResult = await Transaction.findOne({
            where: {
              userId: userId,
              type: 'task_earning',
              status: 'completed',
              createdAt: { [Op.gte]: startDate }
            },
            attributes: [
              [fn('SUM', col('amount')), 'earnings']
            ],
            raw: true
          });

          return {
            platform,
            completedTasks: platformCompletedTasks,
            earnings: parseFloat(platformEarningsResult?.earnings) || 0
          };
        })
      );

      return {
        userMode: 'taskDoer',
        balance,
        activeDevices: {
          value: activeDevices,
          growth: 0 // Can be calculated by comparing with previous period
        },
        completedTasks: {
          value: completedTasks,
          total: totalCompletedTasks,
          growth: 0
        },
        totalEarned: {
          value: totalEarned,
          growth: 0
        },
        inProgressTasks: {
          value: inProgressTasks
        },
        platformStats
      };

    } else {
      // Task Giver specific stats
      
      // Get active orders
      const activeOrders = await Order.count({
        where: {
          userId: userId,
          status: { [Op.in]: ['pending', 'processing'] }
        }
      });

      // Get completed orders
      const completedOrders = await Order.count({
        where: {
          userId: userId,
          status: 'completed',
          createdAt: { [Op.gte]: startDate }
        }
      });

      // Get total orders
      const totalOrders = await Order.count({
        where: {
          userId: userId,
          createdAt: { [Op.gte]: startDate }
        }
      });

      // Get total spent
      const spentResult = await Order.findOne({
        where: {
          userId: userId,
          status: { [Op.ne]: 'cancelled' },
          createdAt: { [Op.gte]: startDate }
        },
        attributes: [
          [fn('SUM', col('amount')), 'totalSpent']
        ]
      });
      const totalSpent = parseFloat(spentResult?.dataValues?.totalSpent) || 0;

      // Platform-specific stats
      const platformStats = await Promise.all(
        ['instagram', 'youtube'].map(async (platform) => {
          // Optimize: Count queries with where conditions
          const platformActiveOrders = await Order.count({
            where: {
              userId: userId,
              platform,
              status: { [Op.in]: ['pending', 'processing'] }
            }
          });

          const platformCompletedOrders = await Order.count({
            where: {
              userId: userId,
              platform,
              status: 'completed',
              createdAt: { [Op.gte]: startDate }
            }
          });

          // Optimize: Single aggregate query
          const platformSpentResult = await Order.findOne({
            where: {
              userId: userId,
              platform,
              status: { [Op.ne]: 'cancelled' },
              createdAt: { [Op.gte]: startDate }
            },
            attributes: [
              [fn('SUM', col('amount')), 'spent']
            ],
            raw: true
          });

          return {
            platform,
            activeOrders: platformActiveOrders,
            completedOrders: platformCompletedOrders,
            totalSpent: parseFloat(platformSpentResult?.spent) || 0
          };
        })
      );

      return {
        userMode: 'taskGiver',
        balance,
        activeOrders: {
          value: activeOrders,
          growth: 0
        },
        completedOrders: {
          value: completedOrders,
          growth: 0
        },
        totalOrders: {
          value: totalOrders,
          growth: 0
        },
        totalSpent: {
          value: totalSpent,
          growth: 0
        },
        platformStats
      };
    }
  }
}