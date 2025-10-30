import AdminRolePermission from '../models/AdminRolePermission.js';
import logger from '../config/logger.js';

// Permission cache: { role: { permission_key: boolean } }
const permissionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let lastCacheUpdate = 0;

/**
 * Load all permissions from database into cache
 */
async function loadPermissionsToCache() {
  try {
    const permissions = await AdminRolePermission.findAll({
      attributes: ['role', 'permissionKey', 'allow'],
      raw: true,
    });

    // Clear existing cache
    permissionCache.clear();

    // Build cache structure
    for (const perm of permissions) {
      if (!permissionCache.has(perm.role)) {
        permissionCache.set(perm.role, {});
      }
      permissionCache.get(perm.role)[perm.permissionKey] = perm.allow;
    }

    lastCacheUpdate = Date.now();
    logger.info('Admin permissions cache updated', {
      roles: permissionCache.size,
      totalPermissions: permissions.length,
    });
  } catch (error) {
    logger.error('Failed to load admin permissions cache', { error: error.message });
    throw error;
  }
}

/**
 * Check if cache needs refresh
 */
async function ensureCacheLoaded() {
  const now = Date.now();
  if (permissionCache.size === 0 || now - lastCacheUpdate > CACHE_TTL) {
    await loadPermissionsToCache();
  }
}

/**
 * Check if a role has a specific permission
 * @param {string} role - Role name (admin, super_admin, moderator)
 * @param {string} permissionKey - Permission key (e.g., 'users.edit')
 * @returns {Promise<boolean>}
 */
export async function hasAdminPermission(role, permissionKey) {
  await ensureCacheLoaded();

  const rolePermissions = permissionCache.get(role);
  if (!rolePermissions) {
    return false;
  }

  // Convert to boolean (handles both 1/0 and true/false)
  return Boolean(rolePermissions[permissionKey]);
}

/**
 * Get all permissions for a specific role
 * @param {string} role - Role name
 * @returns {Promise<Object>} - Object with permission keys and their allow status
 */
export async function getRolePermissions(role) {
  await ensureCacheLoaded();
  return permissionCache.get(role) || {};
}

/**
 * Get all permissions for all roles
 * @returns {Promise<Array>} - Array of permission objects
 */
export async function getAllAdminPermissions() {
  await ensureCacheLoaded();
  
  const result = [];
  for (const [role, permissions] of permissionCache.entries()) {
    for (const [permissionKey, allow] of Object.entries(permissions)) {
      result.push({ role, permissionKey, allow });
    }
  }
  
  return result;
}

/**
 * Update a permission for a role
 * @param {string} role - Role name
 * @param {string} permissionKey - Permission key
 * @param {boolean} allow - Allow or deny
 */
export async function updateAdminPermission(role, permissionKey, allow) {
  try {
    await AdminRolePermission.update(
      { allow },
      { where: { role, permissionKey } }
    );

    // Invalidate cache to force reload
    permissionCache.clear();
    lastCacheUpdate = 0;

    logger.info('Admin permission updated', { role, permissionKey, allow });
  } catch (error) {
    logger.error('Failed to update admin permission', {
      role,
      permissionKey,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Clear the permission cache (useful after bulk updates)
 */
export function clearPermissionCache() {
  permissionCache.clear();
  lastCacheUpdate = 0;
  logger.info('Admin permission cache cleared');
}

export default {
  hasAdminPermission,
  getRolePermissions,
  getAllAdminPermissions,
  updateAdminPermission,
  clearPermissionCache,
};
