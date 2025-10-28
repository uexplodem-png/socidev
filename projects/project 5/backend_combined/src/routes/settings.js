import express from 'express';
import { settingsService } from '../services/settingsService.js';
import logger from '../config/logger.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/settings/public
 * Get public settings (no authentication required)
 * Used by frontend to check maintenance mode, registration status, etc.
 */
router.get('/public', async (req, res, next) => {
  try {
    // Get public settings only (non-sensitive)
    const publicSettings = {
      maintenance: {
        enabled: await settingsService.get('maintenance.enabled', false),
        message: await settingsService.get('maintenance.message', 'The system is currently under maintenance. Please try again later.')
      },
      general: {
        siteName: await settingsService.get('general.siteName', 'SocialDev'),
        allowRegistration: await settingsService.get('general.allowRegistration', true)
      },
      security: {
        emailVerificationRequired: await settingsService.get('security.authentication.emailVerificationRequired', false),
        twoFactorRequired: await settingsService.get('security.authentication.twoFactorRequired', false)
      }
    };

    res.json({
      success: true,
      data: publicSettings
    });
  } catch (error) {
    logger.error('Error fetching public settings:', error);
    next(error);
  }
});

/**
 * GET /api/settings/features
 * Get feature flags (requires authentication)
 * Used by frontend to check which modules are enabled for the user
 */
router.get('/features', authenticateToken, async (req, res, next) => {
  try {
    const features = {
      orders: {
        moduleEnabled: await settingsService.get('features.orders.moduleEnabled', true),
        createEnabled: await settingsService.get('features.orders.createEnabled', true),
        viewEnabled: await settingsService.get('features.orders.viewEnabled', true),
      },
      tasks: {
        moduleEnabled: await settingsService.get('features.tasks.moduleEnabled', true),
        createEnabled: await settingsService.get('features.tasks.createEnabled', true),
        viewEnabled: await settingsService.get('features.tasks.viewEnabled', true),
        approvalRequired: await settingsService.get('features.tasks.approvalRequired', false),
      },
      transactions: {
        moduleEnabled: await settingsService.get('features.transactions.moduleEnabled', true),
        depositsEnabled: await settingsService.get('features.transactions.depositsEnabled', true),
        withdrawalsEnabled: await settingsService.get('features.transactions.withdrawalsEnabled', true),
      },
      users: {
        moduleEnabled: await settingsService.get('features.users.moduleEnabled', true),
        registrationEnabled: await settingsService.get('general.allowRegistration', true),
      },
    };

    res.json({
      success: true,
      data: features
    });
  } catch (error) {
    logger.error('Error fetching feature flags:', error);
    next(error);
  }
});

export { router as settingsRouter };
