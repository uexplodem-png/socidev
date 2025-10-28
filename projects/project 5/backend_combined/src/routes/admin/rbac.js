import express from 'express';
import { Role, Permission, UserRole, RolePermission } from '../../models/index.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import { permissionsService } from '../../services/permissionsService.js';
import { logAudit } from '../../utils/logging.js';
import Joi from 'joi';
import { validate } from '../../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/admin/rbac/roles
 * List all roles with permission counts
 */
router.get('/roles',
  requirePermission('roles.view'),
  asyncHandler(async (req, res) => {
    const roles = await Role.findAll({
      attributes: ['id', 'key', 'label', 'created_at', 'updated_at'],
      include: [
        {
          model: RolePermission,
          as: 'rolePermissions',
          attributes: ['id'],
          required: false
        }
      ],
      order: [['id', 'ASC']]
    });

    const rolesWithCounts = roles.map(role => ({
      id: role.id,
      key: role.key,
      label: role.label,
      permissionCount: role.rolePermissions ? role.rolePermissions.length : 0,
      createdAt: role.created_at,
      updatedAt: role.updated_at
    }));

    res.json({ roles: rolesWithCounts });
  })
);

/**
 * GET /api/admin/rbac/permissions
 * List all permissions grouped by group
 */
router.get('/permissions',
  requirePermission('permissions.view'),
  asyncHandler(async (req, res) => {
    const permissions = await Permission.findAll({
      attributes: ['id', 'key', 'label', 'group'],
      order: [['group', 'ASC'], ['key', 'ASC']],
      raw: true
    });

    // Group by category
    const grouped = {};
    for (const perm of permissions) {
      const group = perm.group || 'other';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(perm);
    }

    res.json({ permissions, grouped });
  })
);

/**
 * GET /api/admin/rbac/roles/:roleId/permissions
 * Get all permissions for a role
 */
router.get('/roles/:roleId/permissions',
  requirePermission('roles.view'),
  asyncHandler(async (req, res) => {
    const { roleId } = req.params;

    const rolePermissions = await RolePermission.findAll({
      where: { role_id: roleId },
      attributes: ['id', 'permission_id', 'mode', 'allow'],
      include: [
        {
          model: Permission,
          as: 'permission',
          attributes: ['id', 'key', 'label', 'group']
        }
      ]
    });

    const permissions = rolePermissions.map(rp => ({
      id: rp.id,
      permissionId: rp.permission_id,
      key: rp.permission.key,
      label: rp.permission.label,
      group: rp.permission.group,
      mode: rp.mode,
      allow: rp.allow === 1
    }));

    res.json({ permissions });
  })
);

/**
 * POST /api/admin/rbac/roles/:roleId/permissions
 * Add or update permission for a role
 */
router.post('/roles/:roleId/permissions',
  requirePermission('roles.edit'),
  validate(Joi.object({
    permissionKey: Joi.string().required(),
    mode: Joi.string().valid('all', 'taskDoer', 'taskGiver').default('all'),
    allow: Joi.boolean().default(true)
  })),
  asyncHandler(async (req, res) => {
    const { roleId } = req.params;
    const { permissionKey, mode, allow } = req.body;

    // Get role and permission
    const role = await Role.findByPk(roleId, { attributes: ['id', 'key', 'label'] });
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const permission = await Permission.findOne({
      where: { key: permissionKey },
      attributes: ['id', 'key', 'label']
    });
    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    // Upsert role permission
    const [rolePermission, created] = await RolePermission.upsert({
      role_id: roleId,
      permission_id: permission.id,
      mode,
      allow: allow ? 1 : 0
    }, {
      returning: true
    });

    // Clear permissions cache
    permissionsService.clearCache();

    // Log the change
    await logAudit(req, {
      action: created ? 'PERMISSION_ADDED' : 'PERMISSION_UPDATED',
      resource: 'role_permission',
      resourceId: rolePermission.id.toString(),
      description: `${created ? 'Added' : 'Updated'} permission ${permissionKey} for role ${role.label}`,
      metadata: { roleId, roleKey: role.key, permissionKey, mode, allow }
    });

    res.json({
      message: `Permission ${created ? 'added' : 'updated'} successfully`,
      rolePermission: {
        id: rolePermission.id,
        roleId: role.id,
        roleLabel: role.label,
        permissionId: permission.id,
        permissionKey: permission.key,
        mode: rolePermission.mode,
        allow: rolePermission.allow === 1
      }
    });
  })
);

/**
 * DELETE /api/admin/rbac/roles/:roleId/permissions/:permissionId
 * Remove permission from role
 */
router.delete('/roles/:roleId/permissions/:permissionId',
  requirePermission('roles.edit'),
  asyncHandler(async (req, res) => {
    const { roleId, permissionId } = req.params;
    const { mode } = req.query;

    const where = { role_id: roleId, permission_id: permissionId };
    if (mode) {
      where.mode = mode;
    }

    const deleted = await RolePermission.destroy({ where });

    if (deleted) {
      permissionsService.clearCache();

      await logAudit(req, {
        action: 'PERMISSION_REMOVED',
        resource: 'role_permission',
        resourceId: `${roleId}-${permissionId}`,
        description: `Removed permission from role`,
        metadata: { roleId, permissionId, mode }
      });

      res.json({ message: 'Permission removed successfully' });
    } else {
      res.status(404).json({ error: 'Role permission not found' });
    }
  })
);

/**
 * GET /api/admin/rbac/users/:userId/roles
 * Get user's roles
 */
router.get('/users/:userId/roles',
  requirePermission('roles.view'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const roles = await permissionsService.getUserRoles(userId);

    res.json({ roles });
  })
);

/**
 * POST /api/admin/rbac/users/:userId/roles
 * Assign or remove role from user
 */
router.post('/users/:userId/roles',
  requirePermission('roles.assign'),
  validate(Joi.object({
    roleKey: Joi.string().required(),
    assign: Joi.boolean().required()
  })),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { roleKey, assign } = req.body;

    // Get role
    const role = await Role.findOne({
      where: { key: roleKey },
      attributes: ['id', 'key', 'label']
    });
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (assign) {
      // Assign role
      const result = await permissionsService.assignRole(userId, role.id);

      await logAudit(req, {
        action: 'ROLE_ASSIGNED',
        resource: 'user_role',
        resourceId: result.userRole.id.toString(),
        targetUserId: userId,
        description: `Assigned role ${role.label} to user`,
        metadata: { roleId: role.id, roleKey: role.key, created: result.created }
      });

      res.json({
        message: result.created ? 'Role assigned successfully' : 'User already has this role',
        role: { id: role.id, key: role.key, label: role.label }
      });
    } else {
      // Remove role
      const removed = await permissionsService.removeRole(userId, role.id);

      if (removed) {
        await logAudit(req, {
          action: 'ROLE_REMOVED',
          resource: 'user_role',
          resourceId: `${userId}-${role.id}`,
          targetUserId: userId,
          description: `Removed role ${role.label} from user`,
          metadata: { roleId: role.id, roleKey: role.key }
        });

        res.json({ message: 'Role removed successfully' });
      } else {
        res.status(404).json({ error: 'User does not have this role' });
      }
    }
  })
);

/**
 * POST /api/admin/rbac/cache/clear
 * Clear permissions cache
 */
router.post('/cache/clear',
  requirePermission('roles.edit'),
  asyncHandler(async (req, res) => {
    permissionsService.clearCache();

    await logAudit(req, {
      action: 'CACHE_CLEARED',
      resource: 'permissions_cache',
      resourceId: 'all',
      description: 'Permissions cache cleared'
    });

    res.json({ message: 'Permissions cache cleared successfully' });
  })
);

export default router;
