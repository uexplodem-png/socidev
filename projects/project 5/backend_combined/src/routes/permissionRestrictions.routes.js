import express from 'express';
import { permissionRestrictionController } from '../controllers/permissionRestriction.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Admin only routes
router.use(authenticateToken);
router.use(authorizeRoles('admin', 'super_admin'));

// Get available permissions
router.get('/permissions/available', permissionRestrictionController.getAvailablePermissions);

// Get user's restrictions
router.get('/users/:userId/restrictions', permissionRestrictionController.getUserRestrictions);

// Update user's restrictions
router.put('/users/:userId/restrictions', permissionRestrictionController.updateUserRestrictions);

// Bulk update restrictions
router.post('/users/bulk-restrictions', permissionRestrictionController.bulkUpdateRestrictions);

export default router;
