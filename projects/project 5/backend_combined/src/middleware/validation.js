import Joi from 'joi';
import logger from '../config/logger.js';

// Generic validation middleware
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      logger.warn('Validation error:', { errors, path: req.path });

      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      });
    }

    // Replace request property with validated value
    req[property] = value;
    next();
  };
};

// Common validation schemas
export const schemas = {
  // Authentication schemas
  login: Joi.object({
    email: Joi.string().email().trim().required(),
    password: Joi.string().min(6).trim().required(),
  }),

  register: Joi.object({
    email: Joi.string().email().trim().required(),
    password: Joi.string().min(8).trim().required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
      }),
    firstName: Joi.string().min(2).max(50).trim().required(),
    lastName: Joi.string().min(2).max(50).trim().required(),
    username: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).min(3).max(30).trim().required()
      .messages({
        'string.pattern.base': 'Username must only contain letters, numbers, underscores, and hyphens',
      }),
    phone: Joi.string().pattern(/^(\+?[1-9]\d{1,14}|0\d{9,14})$/).trim().optional()
      .messages({
        'string.pattern.base': 'Phone number format is invalid. It should be in international format (e.g., +1234567890) or local format (e.g., 01234567890).',
      }),
  }),

  // User management schemas
  updateUser: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().optional(),
    username: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).min(3).max(30).optional()
      .messages({
        'string.pattern.base': 'Username must only contain letters, numbers, underscores, and hyphens',
      }),
    phone: Joi.string().pattern(/^(\+?[1-9]\d{1,14}|0\d{9,14})$/).optional()
      .messages({
        'string.pattern.base': 'Phone number format is invalid. It should be in international format (e.g., +1234567890) or local format (e.g., 01234567890).',
      }),
    password: Joi.string().min(6).max(100).optional()
      .messages({
        'string.min': 'Password must be at least 6 characters',
      }),
    role: Joi.string().valid('task_doer', 'task_giver', 'admin', 'super_admin', 'moderator').optional(),
    status: Joi.string().valid('active', 'suspended', 'banned').optional(),
    balance: Joi.number().min(0).optional(),
  }),

  createUser: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    username: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).min(3).max(30).required()
      .messages({
        'string.pattern.base': 'Username must only contain letters, numbers, underscores, and hyphens',
      }),
    phone: Joi.string().pattern(/^(\+?[1-9]\d{1,14}|0\d{9,14})$/).optional()
      .messages({
        'string.pattern.base': 'Phone number format is invalid. It should be in international format (e.g., +1234567890) or local format (e.g., 01234567890).',
      }),
    role: Joi.string().valid('task_doer', 'task_giver', 'admin', 'super_admin', 'moderator').optional(),
    status: Joi.string().valid('active', 'suspended', 'banned').optional(),
    balance: Joi.number().min(0).optional(),
    password: Joi.string().min(6).optional(),
  }),

  // Order schemas
  createOrder: Joi.object({
    user_id: Joi.string().uuid().required(),
    platform: Joi.string().valid('instagram', 'youtube', 'twitter', 'tiktok').required(),
    service: Joi.string().min(2).max(100).required(),
    target_url: Joi.string().uri().required(),
    quantity: Joi.number().integer().min(1).max(1000000).required(),
    speed: Joi.string().valid('normal', 'fast', 'express').default('normal'),
    amount: Joi.number().min(0.01).required(),
  }),

  updateOrderStatus: Joi.object({
    status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded').required(),
    notes: Joi.string().max(500).optional(),
  }),

  // Task schemas
  createTask: Joi.object({
    title: Joi.string().min(5).max(255).required(),
    description: Joi.string().max(1000).optional(),
    type: Joi.string().valid('like', 'follow', 'view', 'subscribe', 'comment', 'share').required(),
    platform: Joi.string().valid('instagram', 'youtube', 'twitter', 'tiktok').required(),
    target_url: Joi.string().uri().required(),
    quantity: Joi.number().integer().min(1).max(100000).required(),
    rate: Joi.number().min(0.001).max(10).required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    requirements: Joi.string().max(1000).optional(),
  }),

  approveTask: Joi.object({
    notes: Joi.string().max(500).optional(),
  }),

  rejectTask: Joi.object({
    reason: Joi.string().min(10).max(500).required(),
    notes: Joi.string().max(500).optional(),
  }),

  // Transaction schemas
  createTransaction: Joi.object({
    user_id: Joi.string().uuid().required(),
    type: Joi.string().valid('deposit', 'withdrawal', 'order_payment', 'task_earning', 'refund', 'adjustment').required(),
    amount: Joi.number().required(),
    method: Joi.string().valid('bank_transfer', 'credit_card', 'crypto', 'balance', 'paypal').required(),
    description: Joi.string().max(500).optional(),
    details: Joi.object().optional(),
  }),

  // Withdrawal schemas
  createWithdrawal: Joi.object({
    amount: Joi.number().min(0.01).required(),
    method: Joi.string().valid('bank_transfer', 'crypto', 'paypal').required(),
    details: Joi.object().required(),
    notes: Joi.string().max(500).optional(),
  }),

  updateWithdrawalStatus: Joi.object({
    status: Joi.string().valid('processing', 'completed', 'failed', 'cancelled').required(),
    notes: Joi.string().max(500).optional(),
    transaction_id: Joi.string().optional(),
  }),

  // Query parameter schemas
  paginationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(255).optional(),
    sortBy: Joi.string().max(50).optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  userQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(255).allow('').optional(),
    role: Joi.string().valid('task_doer', 'task_giver', 'admin', 'super_admin', 'moderator', 'all').default('all'),
    status: Joi.string().valid('active', 'suspended', 'banned', 'all').default('all'),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'first_name', 'last_name', 'email', 'balance').default('created_at'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  orderQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(255).allow('').optional(),
    platform: Joi.string().valid('instagram', 'youtube', 'twitter', 'tiktok', 'all').allow('').default('all'),
    status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'all').allow('').default('all'),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'amount', 'quantity').default('created_at'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  taskQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(255).allow('').optional(),
    platform: Joi.string().valid('instagram', 'youtube', 'twitter', 'tiktok', 'all').default('all'),
    type: Joi.string().valid('like', 'follow', 'view', 'subscribe', 'comment', 'share', 'all').default('all'),
    admin_status: Joi.string().valid('pending', 'approved', 'rejected', 'all').default('all'),
    status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'cancelled', 'all').default('all'),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent', 'all').default('all'),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'last_updated_at', 'priority').default('created_at'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  transactionQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(255).optional(),
    type: Joi.string().valid('deposit', 'withdrawal', 'order_payment', 'task_earning', 'refund', 'adjustment', 'all').default('all'),
    status: Joi.string().valid('pending', 'completed', 'failed', 'cancelled', 'all').default('all'),
    method: Joi.string().valid('bank_transfer', 'credit_card', 'crypto', 'balance', 'paypal', 'all').default('all'),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'amount').default('created_at'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // Bulk operation schemas
  bulkUserAction: Joi.object({
    action: Joi.string().valid('ban', 'unban', 'suspend', 'activate', 'delete').required(),
    user_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
    reason: Joi.string().max(500).optional(),
  }),

  bulkTaskAction: Joi.object({
    action: Joi.string().valid('approve', 'reject').required(),
    task_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
    reason: Joi.string().max(500).when('action', {
      is: 'reject',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }),

  // Balance adjustment schema
  adjustBalance: Joi.object({
    amount: Joi.number().min(0.01).required(),
    type: Joi.string().valid('add', 'subtract').required(),
    reason: Joi.string().max(500).required(),
  }),

  // Dashboard query schemas
  dashboardStatsQuery: Joi.object({
    timeRange: Joi.string().valid('7d', '30d', '90d', 'custom').default('30d'),
    startDate: Joi.date().when('timeRange', {
      is: 'custom',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    endDate: Joi.date().when('timeRange', {
      is: 'custom',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }),
};

export default { validate, schemas };