import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../config/logger.js';
import { logAudit } from '../utils/logging.js';
import { PERMISSION_INFO } from '../utils/permissions.js';

export class PermissionRestrictionController {
  /**
   * Get user's restricted permissions
   * GET /api/admin/users/:userId/restrictions
   */
  async getUserRestrictions(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'restrictedPermissions']
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      res.json({
        success: true,
        data: {
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          restrictedPermissions: user.restrictedPermissions || []
        }
      });
    } catch (error) {
      logger.error('Get user restrictions error:', error);
      next(error);
    }
  }

  /**
   * Update user's restricted permissions
   * PUT /api/admin/users/:userId/restrictions
   */
  async updateUserRestrictions(req, res, next) {
    try {
      const { userId } = req.params;
      const { restrictedPermissions } = req.body;

      if (!Array.isArray(restrictedPermissions)) {
        throw new ApiError(400, 'restrictedPermissions must be an array');
      }

      const user = await User.findByPk(userId, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'restrictedPermissions']
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      const oldRestrictions = user.restrictedPermissions || [];
      
      // Güncelle
      await user.update({
        restrictedPermissions: restrictedPermissions.length > 0 ? restrictedPermissions : null
      });

      // Audit log
      await logAudit(req, {
        action: 'permission_restriction_updated',
        resource: 'user_permissions',
        resourceId: userId,
        targetUserId: userId,
        targetUserName: `${user.firstName} ${user.lastName}`,
        description: `Permission restrictions updated for ${user.firstName} ${user.lastName}`,
        metadata: {
          oldRestrictions,
          newRestrictions: restrictedPermissions,
          addedRestrictions: restrictedPermissions.filter(p => !oldRestrictions.includes(p)),
          removedRestrictions: oldRestrictions.filter(p => !restrictedPermissions.includes(p))
        }
      });

      logger.info('User restrictions updated', {
        userId,
        adminId: req.user.id,
        oldRestrictions,
        newRestrictions: restrictedPermissions
      });

      res.json({
        success: true,
        message: 'User restrictions updated successfully',
        data: {
          userId: user.id,
          restrictedPermissions: user.restrictedPermissions
        }
      });
    } catch (error) {
      logger.error('Update user restrictions error:', error);
      next(error);
    }
  }

  /**
   * Get available permissions list
   * GET /api/admin/permissions/available
   */
  async getAvailablePermissions(req, res, next) {
    try {
      const permissions = Object.entries(PERMISSION_INFO).map(([key, info]) => ({
        key,
        ...info
      }));

      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      logger.error('Get available permissions error:', error);
      next(error);
    }
  }

  /**
   * Bulk update restrictions for multiple users
   * POST /api/admin/users/bulk-restrictions
   */
  async bulkUpdateRestrictions(req, res, next) {
    try {
      const { userIds, restrictedPermissions } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new ApiError(400, 'userIds must be a non-empty array');
      }

      if (!Array.isArray(restrictedPermissions)) {
        throw new ApiError(400, 'restrictedPermissions must be an array');
      }

      const users = await User.findAll({
        where: { id: userIds },
        attributes: ['id', 'firstName', 'lastName', 'email']
      });

      if (users.length === 0) {
        throw new ApiError(404, 'No users found');
      }

      // Toplu güncelleme
      await User.update(
        { restrictedPermissions: restrictedPermissions.length > 0 ? restrictedPermissions : null },
        { where: { id: userIds } }
      );

      // Her kullanıcı için audit log
      for (const user of users) {
        await logAudit(req, {
          action: 'permission_restriction_bulk_updated',
          resource: 'user_permissions',
          resourceId: user.id,
          targetUserId: user.id,
          targetUserName: `${user.firstName} ${user.lastName}`,
          description: `Bulk permission restrictions updated`,
          metadata: {
            restrictedPermissions,
            bulkOperation: true
          }
        });
      }

      logger.info('Bulk restrictions updated', {
        adminId: req.user.id,
        userCount: users.length,
        restrictedPermissions
      });

      res.json({
        success: true,
        message: `Restrictions updated for ${users.length} user(s)`,
        data: {
          updatedCount: users.length,
          restrictedPermissions
        }
      });
    } catch (error) {
      logger.error('Bulk update restrictions error:', error);
      next(error);
    }
  }
}

export const permissionRestrictionController = new PermissionRestrictionController();
