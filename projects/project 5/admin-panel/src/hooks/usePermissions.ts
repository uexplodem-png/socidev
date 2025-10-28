import { useAppSelector } from '../store';
import { UserRole } from '../types';

interface PermissionConfig {
  [key: string]: UserRole[];
}

const permissions: PermissionConfig = {
  'users.view': ['admin', 'super_admin', 'moderator'],
  'users.create': ['admin', 'super_admin'],
  'users.edit': ['admin', 'super_admin'],
  'users.delete': ['admin', 'super_admin'],
  'orders.view': ['admin', 'super_admin', 'moderator'],
  'orders.edit': ['admin', 'super_admin'],
  'orders.refund': ['admin', 'super_admin'],
  'withdrawals.view': ['admin', 'super_admin', 'moderator'],
  'withdrawals.process': ['admin', 'super_admin'],
  'transactions.view': ['admin', 'super_admin', 'moderator'],
  'transactions.approve': ['admin', 'super_admin'],
  'transactions.reject': ['admin', 'super_admin'],
  'tasks.view': ['admin', 'super_admin', 'moderator'],
  'tasks.edit': ['admin', 'super_admin'],
  'devices.view': ['admin', 'super_admin', 'moderator'],
  'devices.edit': ['admin', 'super_admin'],
  'settings.view': ['admin', 'super_admin'],
  'settings.edit': ['admin', 'super_admin'],
  'analytics.view': ['admin', 'super_admin'],
};

export const usePermissions = () => {
  const user = useAppSelector(state => state.auth.user);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const allowedRoles = permissions[permission];
    if (!allowedRoles) return false;

    return allowedRoles.includes(user.role);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every(permission => hasPermission(permission));
  };

  const canAccess = (resource: string, action: string = 'view'): boolean => {
    return hasPermission(`${resource}.${action}`);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    userRole: user?.role,
    isAdmin: user?.role === 'admin',
    isSuperAdmin: user?.role === 'super_admin',
    isTaskGiver: user?.role === 'task_giver',
    isTaskDoer: user?.role === 'task_doer',
    isModerator: user?.role === 'moderator',
  };
};