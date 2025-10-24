import express from 'express';
import { SocialAccountController } from '../controllers/social-account.controller.js';
import { authenticateToken as auth } from '../middleware/auth.js';
import { validateSocialAccount, validateAccountSettings } from '../validators/social-account.validator.js';

const router = express.Router();
const socialAccountController = new SocialAccountController();

// Add social account
router.post('/',
  auth,
  validateSocialAccount,
  socialAccountController.addAccount
);

// Get user's social accounts
router.get('/',
  auth,
  socialAccountController.getAccounts
);

// Get account details
router.get('/:id',
  auth,
  socialAccountController.getAccountDetails
);

// Update account settings
router.put('/:id/settings',
  auth,
  validateAccountSettings,
  socialAccountController.updateAccountSettings
);

// Delete account
router.delete('/:id',
  auth,
  socialAccountController.deleteAccount
);

// Get account stats
router.get('/:id/stats',
  auth,
  socialAccountController.getAccountStats
);

export { router as socialAccountRouter };