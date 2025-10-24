import express from 'express';
import { ActivityLog } from '../../models/index.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import Joi from 'joi';

const router = express.Router();

// In-memory settings store (in production, this would be in database)
let systemSettings = {
  siteName: 'Social Developer Platform',
  maintenanceMode: false,
  registrationEnabled: true,
  emailNotifications: true,
  taskAutoApproval: false,
  maxTasksPerUser: 100,
  minWithdrawalAmount: 10,
  withdrawalFee: 0.05,
  currencies: ['USD', 'EUR', 'GBP'],
  supportedPlatforms: ['instagram', 'youtube', 'twitter', 'tiktok'],
  taskApprovalTimeoutHours: 24,
  orderTimeoutHours: 72,
  // Security settings
  twoFactorAuth: false,
  passwordMinLength: 8,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  lockoutDuration: 30,
  // Notification settings
  smsNotifications: false,
  pushNotifications: false,
  adminNotifications: true,
  userActivityNotifications: false,
  // Analytics settings
  enableAnalytics: true,
  analyticsRetentionDays: 90,
  trackUserBehavior: true,
  // Performance settings
  cacheEnabled: true,
  cacheTTL: 300,
  apiRateLimit: 1000,
  // Advanced settings
  debugMode: false,
  logLevel: 'info',
  autoBackup: true,
  backupFrequency: 'daily',
};

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get system settings
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings
 */
router.get('/',
  requirePermission('settings.view'),
  asyncHandler(async (req, res) => {
    res.json(systemSettings);
  })
);

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Update system settings
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               siteName:
 *                 type: string
 *               maintenanceMode:
 *                 type: boolean
 *               registrationEnabled:
 *                 type: boolean
 *               emailNotifications:
 *                 type: boolean
 *               taskAutoApproval:
 *                 type: boolean
 *               maxTasksPerUser:
 *                 type: integer
 *                 minimum: 1
 *               minWithdrawalAmount:
 *                 type: number
 *                 minimum: 0.01
 *               withdrawalFee:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.put('/',
  requirePermission('settings.edit'),
  validate(Joi.object({
    siteName: Joi.string().min(1).max(100).optional(),
    maintenanceMode: Joi.boolean().optional(),
    registrationEnabled: Joi.boolean().optional(),
    emailNotifications: Joi.boolean().optional(),
    taskAutoApproval: Joi.boolean().optional(),
    maxTasksPerUser: Joi.number().integer().min(1).max(1000).optional(),
    minWithdrawalAmount: Joi.number().min(0.01).max(1000).optional(),
    withdrawalFee: Joi.number().min(0).max(1).optional(),
    currencies: Joi.array().items(Joi.string().length(3)).optional(),
    supportedPlatforms: Joi.array().items(Joi.string()).optional(),
    taskApprovalTimeoutHours: Joi.number().integer().min(1).max(168).optional(),
    orderTimeoutHours: Joi.number().integer().min(1).max(720).optional(),
    // Security settings
    twoFactorAuth: Joi.boolean().optional(),
    passwordMinLength: Joi.number().integer().min(6).max(128).optional(),
    sessionTimeout: Joi.number().integer().min(1).max(1440).optional(),
    maxLoginAttempts: Joi.number().integer().min(1).max(20).optional(),
    lockoutDuration: Joi.number().integer().min(1).max(1440).optional(),
    // Notification settings
    smsNotifications: Joi.boolean().optional(),
    pushNotifications: Joi.boolean().optional(),
    adminNotifications: Joi.boolean().optional(),
    userActivityNotifications: Joi.boolean().optional(),
    // Analytics settings
    enableAnalytics: Joi.boolean().optional(),
    analyticsRetentionDays: Joi.number().integer().min(1).max(3650).optional(),
    trackUserBehavior: Joi.boolean().optional(),
    // Performance settings
    cacheEnabled: Joi.boolean().optional(),
    cacheTTL: Joi.number().integer().min(1).max(86400).optional(),
    apiRateLimit: Joi.number().integer().min(1).max(10000).optional(),
    // Advanced settings
    debugMode: Joi.boolean().optional(),
    logLevel: Joi.string().valid('error', 'warn', 'info', 'debug').optional(),
    autoBackup: Joi.boolean().optional(),
    backupFrequency: Joi.string().valid('daily', 'weekly', 'monthly').optional(),
  })),
  asyncHandler(async (req, res) => {
    const updates = req.body;
    const originalSettings = { ...systemSettings };

    // Update settings
    systemSettings = { ...systemSettings, ...updates };

    // Log settings update
    await ActivityLog.log(
      req.user.id,
      'SETTINGS_UPDATED',
      'settings',
      'system',
      null,
      'System settings updated',
      {
        changes: {
          before: originalSettings,
          after: updates,
        },
      },
      req
    );

    res.json({
      settings: systemSettings,
      message: 'Settings updated successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/settings/reset-data:
 *   post:
 *     summary: Reset system data to seed data (development only)
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data reset successfully
 *       403:
 *         description: Not allowed in production
 */
router.post('/reset-data',
  requirePermission('settings.edit'),
  asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Data reset not allowed in production',
        code: 'PRODUCTION_RESTRICTION',
      });
    }

    // In a real implementation, this would reset database to seed data
    // For now, we'll just log the action
    await ActivityLog.log(
      req.user.id,
      'DATA_RESET',
      'system',
      'all',
      null,
      'System data reset to seed data',
      {
        environment: process.env.NODE_ENV,
      },
      req
    );

    res.json({
      message: 'Data reset successfully',
      warning: 'This action would reset all data in a real implementation',
    });
  })
);

/**
 * @swagger
 * /api/admin/settings/backup:
 *   post:
 *     summary: Create system backup
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup created successfully
 */
router.post('/backup',
  requirePermission('settings.edit'),
  asyncHandler(async (req, res) => {
    // In a real implementation, this would create a database backup
    const backupId = `backup_${Date.now()}`;

    await ActivityLog.log(
      req.user.id,
      'BACKUP_CREATED',
      'system',
      backupId,
      null,
      'System backup created',
      {
        backupId,
        timestamp: new Date().toISOString(),
      },
      req
    );

    res.json({
      message: 'Backup created successfully',
      backupId,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;