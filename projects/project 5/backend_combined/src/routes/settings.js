import express from 'express';
import { settingsService } from '../services/settingsService.js';
import logger from '../config/logger.js';

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

export { router as settingsRouter };
