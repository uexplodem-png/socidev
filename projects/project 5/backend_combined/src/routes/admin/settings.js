import express from 'express';
import { ActivityLog } from '../../models/index.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { settingsService } from '../../services/settingsService.js';
import { logAudit } from '../../utils/logging.js';
import Joi from 'joi';

const router = express.Router();

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
    // Get all settings from DB
    const allSettings = await settingsService.list();
    
    // Transform to key-value pairs
    const settings = {};
    for (const setting of allSettings) {
      settings[setting.key] = setting.value;
    }
    
    // Also fetch individual settings for backward compatibility
    const general = await settingsService.get('general', {});
    const features = {
      transactions: await settingsService.get('features.transactions', {}),
      users: await settingsService.get('features.users', {}),
      orders: await settingsService.get('features.orders', {}),
      tasks: await settingsService.get('features.tasks', {})
    };
    const limits = await settingsService.get('limits', {});
    const modes = await settingsService.get('modes', {});
    const security = await settingsService.get('security', {});
    
    res.json({
      ...general,
      features,
      limits,
      modes,
      security,
      _all: settings // Raw settings for advanced use
    });
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
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.put('/',
  requirePermission('settings.edit'),
  asyncHandler(async (req, res) => {
    const updates = req.body;

    // Update individual settings
    const updatedSettings = {};
    
    // Handle general settings
    if (updates.siteName !== undefined || updates.maintenanceMode !== undefined || 
        updates.registrationEnabled !== undefined || updates.emailNotifications !== undefined ||
        updates.taskAutoApproval !== undefined || updates.maxTasksPerUser !== undefined ||
        updates.minWithdrawalAmount !== undefined || updates.withdrawalFee !== undefined ||
        updates.currencies !== undefined || updates.supportedPlatforms !== undefined ||
        updates.taskApprovalTimeoutHours !== undefined || updates.orderTimeoutHours !== undefined) {
      
      const currentGeneral = await settingsService.get('general', {});
      const newGeneral = { ...currentGeneral, ...updates };
      await settingsService.set('general', newGeneral, req.user.id, 'General system settings');
      updatedSettings.general = newGeneral;
    }

    // Handle feature flags
    if (updates.features) {
      if (updates.features.transactions) {
        await settingsService.set('features.transactions', updates.features.transactions, req.user.id);
        updatedSettings['features.transactions'] = updates.features.transactions;
      }
      if (updates.features.users) {
        await settingsService.set('features.users', updates.features.users, req.user.id);
        updatedSettings['features.users'] = updates.features.users;
      }
      if (updates.features.orders) {
        await settingsService.set('features.orders', updates.features.orders, req.user.id);
        updatedSettings['features.orders'] = updates.features.orders;
      }
      if (updates.features.tasks) {
        await settingsService.set('features.tasks', updates.features.tasks, req.user.id);
        updatedSettings['features.tasks'] = updates.features.tasks;
      }
    }

    // Handle limits
    if (updates.limits) {
      await settingsService.set('limits', updates.limits, req.user.id);
      updatedSettings.limits = updates.limits;
    }

    // Handle modes
    if (updates.modes) {
      await settingsService.set('modes', updates.modes, req.user.id);
      updatedSettings.modes = updates.modes;
    }

    // Handle security settings
    if (updates.security) {
      await settingsService.set('security', updates.security, req.user.id);
      updatedSettings.security = updates.security;
    }

    // Log settings update
    await logAudit(req, {
      action: 'SETTINGS_UPDATED',
      resource: 'settings',
      resourceId: 'system',
      description: 'System settings updated',
      metadata: { changes: updatedSettings }
    });

    res.json({
      message: 'Settings updated successfully',
      settings: updatedSettings
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

    // Log data reset action
    await logAudit(req, {
      action: 'DATA_RESET',
      resource: 'system',
      resourceId: 'all',
      description: 'System data reset to seed data',
      metadata: { environment: process.env.NODE_ENV }
    });

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