import express from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requireAdminPermission } from '../../middleware/auth.js';
import { 
  getAllAdminPermissions, 
  updateAdminPermission, 
  clearPermissionCache 
} from '../../services/adminPermissionService.js';
import { logAudit } from '../../utils/logging.js';
import { AdminRolePermission } from '../../models/index.js';
import Joi from 'joi';

const router = express.Router();

/**
 * GET /api/admin/admin-permissions
 * Get all admin role permissions
 */
router.get('/',
  requireAdminPermission('roles.manage'), // Only super_admin can manage role permissions
  asyncHandler(async (req, res) => {
    const permissions = await getAllAdminPermissions();
    
    // Group by role for easier frontend consumption
    const grouped = {
      super_admin: [],
      admin: [],
      moderator: [],
    };

    for (const perm of permissions) {
      grouped[perm.role].push({
        permissionKey: perm.permissionKey,
        allow: perm.allow,
      });
    }

    res.json({
      success: true,
      data: {
        permissions: grouped,
        raw: permissions, // Also send flat array
      },
    });
  })
);

/**
 * PUT /api/admin/admin-permissions
 * Update a single admin permission
 */
router.put('/',
  requireAdminPermission('roles.manage'), // Only super_admin can manage role permissions
  asyncHandler(async (req, res) => {
    const schema = Joi.object({
      role: Joi.string().valid('super_admin', 'admin', 'moderator').required(),
      permissionKey: Joi.string().required(),
      allow: Joi.boolean().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details,
      });
    }

    const { role, permissionKey, allow } = value;

    // Get old value for audit log
    const oldPermission = await AdminRolePermission.findOne({
      where: { role, permissionKey },
      attributes: ['allow'],
    });

    // Update permission
    await updateAdminPermission(role, permissionKey, allow);

    // Log to audit
    await logAudit(req, {
      action: 'ADMIN_PERMISSION_UPDATED',
      resource: 'admin_role_permission',
      resourceId: `${role}:${permissionKey}`,
      description: `Updated ${role} permission for ${permissionKey}: ${oldPermission?.allow} → ${allow}`,
      metadata: {
        role,
        permissionKey,
        oldValue: oldPermission?.allow || false,
        newValue: allow,
      },
    });

    res.json({
      success: true,
      message: 'Permission updated successfully',
      data: {
        role,
        permissionKey,
        allow,
      },
    });
  })
);

/**
 * POST /api/admin/admin-permissions/bulk-update
 * Update multiple permissions at once
 */
router.post('/bulk-update',
  requireAdminPermission('roles.manage'), // Only super_admin can manage role permissions
  asyncHandler(async (req, res) => {
    const schema = Joi.object({
      updates: Joi.array().items(
        Joi.object({
          role: Joi.string().valid('super_admin', 'admin', 'moderator').required(),
          permissionKey: Joi.string().required(),
          allow: Joi.boolean().required(),
        })
      ).min(1).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details,
      });
    }

    const { updates } = value;
    const results = [];

    for (const update of updates) {
      await updateAdminPermission(update.role, update.permissionKey, update.allow);
      results.push(update);
    }

    // Log bulk update
    await logAudit(req, {
      action: 'ADMIN_PERMISSIONS_BULK_UPDATED',
      resource: 'admin_role_permission',
      description: `Bulk updated ${updates.length} admin permissions`,
      metadata: {
        count: updates.length,
        updates,
      },
    });

    res.json({
      success: true,
      message: `${updates.length} permissions updated successfully`,
      data: {
        count: updates.length,
        results,
      },
    });
  })
);

/**
 * POST /api/admin/admin-permissions/clear-cache
 * Clear the permission cache (useful after database changes)
 */
router.post('/clear-cache',
  requireAdminPermission('roles.manage'), // Only super_admin can clear cache
  asyncHandler(async (req, res) => {
    clearPermissionCache();

    await logAudit(req, {
      action: 'PERMISSION_CACHE_CLEARED',
      resource: 'admin_role_permission',
      description: 'Admin permission cache cleared',
    });

    res.json({
      success: true,
      message: 'Permission cache cleared successfully',
    });
  })
);

export default router;
