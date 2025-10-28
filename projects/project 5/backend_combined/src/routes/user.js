import express from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticateToken as auth } from '../middleware/auth.js';
import { validateProfileUpdate, validatePasswordUpdate, validateSettingsUpdate } from '../validators/user.validator.js';

const router = express.Router();
const userController = new UserController();

// Get profile
router.get('/profile',
  auth,
  userController.getProfile
);

// Update profile
router.put('/profile',
  auth,
  validateProfileUpdate,
  userController.updateProfile
);

// Update password
router.put('/password',
  auth,
  validatePasswordUpdate,
  userController.updatePassword
);

// Update user mode
router.put('/mode',
  auth,
  userController.updateUserMode
);

// Get settings
router.get('/settings',
  auth,
  userController.getSettings
);

// Update settings
router.put('/settings',
  auth,
  validateSettingsUpdate,
  userController.updateSettings
);

// Get dashboard statistics
router.get('/dashboard-stats',
  auth,
  userController.getDashboardStats
);

export { router as userRouter };