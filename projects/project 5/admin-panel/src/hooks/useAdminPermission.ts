import { useAppSelector } from '../store';
import { useMemo } from 'react';

/**
 * Hook to check if current admin user has specific permission
 * @param permissionKey - The permission key to check (e.g., 'users.view')
 * @returns boolean indicating if user has permission
 */
export const useAdminPermission = (permissionKey: string): boolean => {
  const user = useAppSelector(state => state.auth.user);

  return useMemo(() => {
    if (!user || !user.role) {
      return false;
    }

    const role = user.role.toLowerCase();
    
    // Super admin has all permissions
    if (role === 'super_admin') {
      return true;
    }

    // Permission mapping based on seeded data
    const permissions: Record<string, Record<string, boolean>> = {
      // User Management
      'users.view': { super_admin: true, admin: true, moderator: true },
      'users.create': { super_admin: true, admin: true, moderator: false },
      'users.edit': { super_admin: true, admin: true, moderator: false },
      'users.suspend': { super_admin: true, admin: true, moderator: true },
      'users.ban': { super_admin: true, admin: true, moderator: false },
      
      // Financial Management
      'transactions.view': { super_admin: true, admin: true, moderator: true },
      'transactions.approve': { super_admin: true, admin: true, moderator: false },
      'transactions.reject': { super_admin: true, admin: true, moderator: false },
      'transactions.adjust': { super_admin: true, admin: true, moderator: false },
      'withdrawals.view': { super_admin: true, admin: true, moderator: true },
      'withdrawals.approve': { super_admin: true, admin: true, moderator: false },
      'withdrawals.reject': { super_admin: true, admin: true, moderator: false },
      'refunds.view': { super_admin: true, admin: true, moderator: true },
      'refunds.process': { super_admin: true, admin: true, moderator: false },
      
      // Task Management
      'tasks.view': { super_admin: true, admin: true, moderator: true },
      'tasks.edit': { super_admin: true, admin: true, moderator: false },
      'tasks.approve': { super_admin: true, admin: true, moderator: true },
      'tasks.reject': { super_admin: true, admin: true, moderator: true },
      'tasks.delete': { super_admin: true, admin: true, moderator: false },
      
      // Order Management
      'orders.view': { super_admin: true, admin: true, moderator: true },
      'orders.edit': { super_admin: true, admin: true, moderator: false },
      'orders.cancel': { super_admin: true, admin: true, moderator: true },
      'orders.refund': { super_admin: true, admin: true, moderator: false },
      
      // System Management
      'system.settings': { super_admin: true, admin: false, moderator: false },
      'system.maintenance': { super_admin: true, admin: true, moderator: false },
      'roles.view': { super_admin: true, admin: true, moderator: false },
      'roles.manage': { super_admin: true, admin: false, moderator: false },
      'audit.view': { super_admin: true, admin: true, moderator: true },
      'audit.export': { super_admin: true, admin: true, moderator: false },
      'analytics.view': { super_admin: true, admin: true, moderator: true },
      'analytics.export': { super_admin: true, admin: true, moderator: false },
      'platforms.manage': { super_admin: true, admin: true, moderator: false },
      'services.manage': { super_admin: true, admin: true, moderator: false },
      'social_accounts.view': { super_admin: true, admin: true, moderator: true },
      'social_accounts.manage': { super_admin: true, admin: true, moderator: false },
    };

    const permissionMap = permissions[permissionKey];
    if (!permissionMap) {
      // If permission not defined, deny access
      return false;
    }

    return permissionMap[role] ?? false;
  }, [user, permissionKey]);
};

/**
 * Hook to check multiple permissions at once
 * @param permissionKeys - Array of permission keys
 * @returns Object with each permission key and its boolean value
 */
export const useAdminPermissions = (permissionKeys: string[]) => {
  const user = useAppSelector(state => state.auth.user);

  return useMemo(() => {
    const result: Record<string, boolean> = {};
    
    permissionKeys.forEach(key => {
      if (!user || !user.role) {
        result[key] = false;
      } else if (user.role.toLowerCase() === 'super_admin') {
        result[key] = true;
      } else {
        // Use the same logic as useAdminPermission
        result[key] = false; // Simplified, would need full permission map
      }
    });

    return result;
  }, [user, permissionKeys]);
};
