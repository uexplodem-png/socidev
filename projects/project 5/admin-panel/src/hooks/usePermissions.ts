import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '../store';

interface Role {
  id: number;
  key: string;
  label: string;
}

const CACHE_KEY = 'user_permissions_cache';
const CACHE_DURATION = 60000; // 60 seconds

interface CachedData {
  permissions: string[];
  roles: Role[];
  timestamp: number;
}

/**
 * Hook for checking user permissions in the frontend.
 * Integrates with RBAC system and caches permissions for 60 seconds.
 * 
 * @example
 * const { hasPermission, isLoading } = usePermissions();
 * 
 * if (hasPermission('users.edit')) {
 *   return <EditButton />;
 * }
 */
export const usePermissions = () => {
  const user = useAppSelector(state => state.auth.user);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cached data from sessionStorage
  const loadFromCache = useCallback((): CachedData | null => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: CachedData = JSON.parse(cached);
      const age = Date.now() - data.timestamp;

      // Return cached data if it's fresh
      if (age < CACHE_DURATION) {
        return data;
      }

      // Clear stale cache
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    } catch (error) {
      console.error('Failed to load permissions cache:', error);
      return null;
    }
  }, []);

  // Save data to cache
  const saveToCache = useCallback((perms: string[], userRoles: Role[]) => {
    try {
      const data: CachedData = {
        permissions: perms,
        roles: userRoles,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save permissions cache:', error);
    }
  }, []);

  // Fetch permissions from the backend API
  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      // First check cache
      const cached = loadFromCache();
      if (cached) {
        setPermissions(cached.permissions);
        setRoles(cached.roles);
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setPermissions([]);
        setRoles([]);
        setIsLoading(false);
        return;
      }

      // Fetch permissions from backend API
      try {
        const response = await fetch('http://localhost:3000/api/admin/admin-permissions/my-permissions', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const permissionMap = data.data?.permissions || {};

          // Convert permission map to array of permission keys that are true
          const userPermissions = Object.keys(permissionMap).filter(key => permissionMap[key]);

          // Set role based on user data
          const userRoles = user?.role ? [{ id: 1, key: user.role, label: user.role }] : [];

          console.log('✅ Permissions loaded from backend:', {
            role: user?.role,
            permissionCount: userPermissions.length,
            hasUsersView: userPermissions.includes('users.view'),
            samplePermissions: userPermissions.slice(0, 5)
          });

          setPermissions(userPermissions);
          setRoles(userRoles);
          saveToCache(userPermissions, userRoles);
        } else {
          // Fallback to JWT decode if API fails
          console.warn('Failed to fetch permissions from API, falling back to JWT');
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const payload = JSON.parse(jsonPayload);

            const userPermissions = payload.permissions || [];
            const userRoles = payload.roles || [];

            setPermissions(userPermissions);
            setRoles(userRoles);
            saveToCache(userPermissions, userRoles);
          } catch (error) {
            console.error('Failed to decode token:', error);
            setPermissions([]);
            setRoles([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        setPermissions([]);
        setRoles([]);
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      setPermissions([]);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [loadFromCache, saveToCache, user]);

  // Load permissions on mount or when token changes
  useEffect(() => {
    if (user) {
      fetchPermissions();
    } else {
      // Clear permissions when user logs out
      setPermissions([]);
      setRoles([]);
      sessionStorage.removeItem(CACHE_KEY);
    }
  }, [fetchPermissions, user]);

  // Check if user has a specific permission
  const hasPermission = useCallback(
    (permissionKey: string): boolean => {
      if (!user) return false;

      // Super admin has all permissions
      if (roles.some((role) => role.key === 'super_admin')) {
        return true;
      }

      // Check if user has permission from backend API
      // permissions array contains only the permission keys that are true
      const hasPermissionFromBackend = permissions.includes(permissionKey);

      // If we have loaded permissions from backend (permissions.length > 0), trust them
      if (permissions.length > 0) {
        return hasPermissionFromBackend;
      }

      // Fallback to hardcoded map only if backend fetch failed (permissions.length === 0)
      const role = user.role?.toLowerCase();
      if (role === 'super_admin' || role === 'admin' || role === 'moderator') {
        // Permission mapping based on seeded data
        const permissionMap: Record<string, Record<string, boolean>> = {
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
          'balance.view': { super_admin: true, admin: true, moderator: true },

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
          'audit_logs.view': { super_admin: true, admin: true, moderator: true }, // Alias
          'analytics.view': { super_admin: true, admin: true, moderator: true },
          'analytics.export': { super_admin: true, admin: true, moderator: false },
          'platforms.manage': { super_admin: true, admin: true, moderator: false },
          'platforms.view': { super_admin: true, admin: true, moderator: true }, // Alias
          'services.manage': { super_admin: true, admin: true, moderator: false },
          'social_accounts.view': { super_admin: true, admin: true, moderator: true },
          'social_accounts.manage': { super_admin: true, admin: true, moderator: false },
          'devices.view': { super_admin: true, admin: true, moderator: true },
          'settings.view': { super_admin: true, admin: true, moderator: false },
        };

        const perms = permissionMap[permissionKey];
        if (perms && perms[role]) {
          return true;
        }
      }

      return false;
    },
    [permissions, roles, user]
  );

  // Check if user has a specific role
  const hasRole = useCallback(
    (roleKey: string): boolean => {
      if (!user) return false;
      return roles.some((role) => role.key === roleKey);
    },
    [roles, user]
  );

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback(
    (permissionKeys: string[]): boolean => {
      if (!user) return false;

      if (roles.some((role) => role.key === 'super_admin')) {
        return true;
      }

      return permissionKeys.some((key) => permissions.includes(key));
    },
    [permissions, roles, user]
  );

  // Check if user has all of the specified permissions
  const hasAllPermissions = useCallback(
    (permissionKeys: string[]): boolean => {
      if (!user) return false;

      if (roles.some((role) => role.key === 'super_admin')) {
        return true;
      }

      return permissionKeys.every((key) => permissions.includes(key));
    },
    [permissions, roles, user]
  );

  // Helper for checking resource.action pattern
  const canAccess = useCallback(
    (resource: string, action: string = 'view'): boolean => {
      return hasPermission(`${resource}.${action}`);
    },
    [hasPermission]
  );

  // Refresh permissions (clear cache and reload)
  const refresh = useCallback(async () => {
    sessionStorage.removeItem(CACHE_KEY);
    await fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    roles,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    isLoading,
    refresh,
    // Legacy compatibility
    userRole: user?.role,
    isAdmin: hasRole('admin'),
    isSuperAdmin: hasRole('super_admin'),
    isTaskGiver: hasRole('task_giver'),
    isTaskDoer: hasRole('task_doer'),
    isModerator: hasRole('moderator'),
  };
};