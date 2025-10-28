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

  // Fetch permissions from the token
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

      // Extract from JWT token if present
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Decode JWT (simple base64 decode, not verification)
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);

          // Extract permissions and roles from token
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
      } else {
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
  }, [loadFromCache, saveToCache]);

  // Load permissions on mount or when token changes
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Check if user has a specific permission
  const hasPermission = useCallback(
    (permissionKey: string): boolean => {
      if (!user) return false;
      
      // Super admin has all permissions
      if (roles.some((role) => role.key === 'super_admin')) {
        return true;
      }
      
      return permissions.includes(permissionKey);
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