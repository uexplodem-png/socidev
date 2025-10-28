import { User, Role, Permission, UserRole, RolePermission } from '../models/index.js';
import logger from '../config/logger.js';

class PermissionsService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 60000; // 60 seconds
  }

  /**
   * Check if user has a specific permission
   * @param {string} userId - User ID
   * @param {string} permissionKey - Permission key (e.g., 'users.edit')
   * @param {string} mode - User mode ('taskDoer', 'taskGiver', or 'all')
   * @returns {Promise<boolean>} Whether user has permission
   */
  async userHasPermission(userId, permissionKey, mode = 'all') {
    try {
      // Check cache first
      const cacheKey = `${userId}:${permissionKey}:${mode}`;
      const cached = this._getFromCache(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      // Query database with optimized attributes
      const userRoles = await UserRole.findAll({
        where: { user_id: userId },
        attributes: ['role_id'],
        include: [
          {
            model: Role,
            as: 'role',
            attributes: ['id', 'key'],
            include: [
              {
                model: RolePermission,
                as: 'rolePermissions',
                attributes: ['permission_id', 'mode', 'allow'],
                where: {
                  mode: ['all', mode]
                },
                required: false,
                include: [
                  {
                    model: Permission,
                    as: 'permission',
                    attributes: ['id', 'key'],
                    where: { key: permissionKey },
                    required: true
                  }
                ]
              }
            ]
          }
        ]
      });

      // Check if any role grants the permission
      let hasPermission = false;
      for (const userRole of userRoles) {
        if (userRole.role && userRole.role.rolePermissions) {
          for (const rolePerm of userRole.role.rolePermissions) {
            if (rolePerm.allow === 1) {
              hasPermission = true;
              break;
            }
          }
        }
        if (hasPermission) break;
      }

      // Cache the result
      this._setCache(cacheKey, hasPermission);

      return hasPermission;
    } catch (error) {
      logger.error(`PermissionsService.userHasPermission error:`, error);
      return false;
    }
  }

  /**
   * Get all permissions for a user
   * @param {string} userId - User ID
   * @param {string} mode - User mode
   * @returns {Promise<string[]>} Array of permission keys
   */
  async getUserPermissions(userId, mode = 'all') {
    try {
      const userRoles = await UserRole.findAll({
        where: { user_id: userId },
        attributes: ['role_id'],
        include: [
          {
            model: Role,
            as: 'role',
            attributes: ['id', 'key'],
            include: [
              {
                model: RolePermission,
                as: 'rolePermissions',
                attributes: ['permission_id', 'mode', 'allow'],
                where: {
                  mode: ['all', mode],
                  allow: 1
                },
                required: false,
                include: [
                  {
                    model: Permission,
                    as: 'permission',
                    attributes: ['key'],
                    required: true
                  }
                ]
              }
            ]
          }
        ]
      });

      const permissions = new Set();
      for (const userRole of userRoles) {
        if (userRole.role && userRole.role.rolePermissions) {
          for (const rolePerm of userRole.role.rolePermissions) {
            if (rolePerm.permission) {
              permissions.add(rolePerm.permission.key);
            }
          }
        }
      }

      return Array.from(permissions);
    } catch (error) {
      logger.error(`PermissionsService.getUserPermissions error:`, error);
      return [];
    }
  }

  /**
   * Get user roles
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of roles
   */
  async getUserRoles(userId) {
    try {
      const userRoles = await UserRole.findAll({
        where: { user_id: userId },
        attributes: ['role_id'],
        include: [
          {
            model: Role,
            as: 'role',
            attributes: ['id', 'key', 'label']
          }
        ],
        raw: false
      });

      return userRoles.map(ur => ur.role);
    } catch (error) {
      logger.error(`PermissionsService.getUserRoles error:`, error);
      return [];
    }
  }

  /**
   * Assign role to user
   * @param {string} userId - User ID
   * @param {number} roleId - Role ID
   * @returns {Promise<Object>} Created user role
   */
  async assignRole(userId, roleId) {
    try {
      const [userRole, created] = await UserRole.findOrCreate({
        where: { user_id: userId, role_id: roleId },
        defaults: { user_id: userId, role_id: roleId }
      });

      // Invalidate user's permission cache
      this._invalidateUserCache(userId);

      return { userRole, created };
    } catch (error) {
      logger.error(`PermissionsService.assignRole error:`, error);
      throw error;
    }
  }

  /**
   * Remove role from user
   * @param {string} userId - User ID
   * @param {number} roleId - Role ID
   * @returns {Promise<boolean>} Success status
   */
  async removeRole(userId, roleId) {
    try {
      const deleted = await UserRole.destroy({
        where: { user_id: userId, role_id: roleId }
      });

      if (deleted) {
        this._invalidateUserCache(userId);
      }

      return deleted > 0;
    } catch (error) {
      logger.error(`PermissionsService.removeRole error:`, error);
      throw error;
    }
  }

  /**
   * Clear entire permissions cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Permissions cache cleared');
  }

  /**
   * Invalidate all cache entries for a user
   * @private
   */
  _invalidateUserCache(userId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get value from cache
   * @private
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return undefined;

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return cached.value;
  }

  /**
   * Set value in cache
   * @private
   */
  _setCache(key, value) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.cacheTTL
    });
  }
}

// Export singleton instance
export const permissionsService = new PermissionsService();
export default permissionsService;
