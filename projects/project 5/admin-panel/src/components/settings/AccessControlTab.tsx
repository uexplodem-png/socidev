import React, { useState, useEffect } from 'react';
import { Shield, Users, RefreshCw, Check, X } from 'lucide-react';
import { rbacAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Role {
  id: number;
  key: string;
  label: string;
  permissionCount?: number;
}

interface Permission {
  id: number;
  key: string;
  label: string;
  group: string;
}

interface RolePermission {
  id: number;
  roleId: number;
  permissionId: number;
  mode: 'all' | 'taskDoer' | 'taskGiver';
  allow: boolean;
}

const AccessControlTab: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<number, RolePermission[]>>({});
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadRBACData();
  }, []);

  const loadRBACData = async () => {
    try {
      const [rolesData, permissionsData] = await Promise.all([
        rbacAPI.getRoles(),
        rbacAPI.getPermissions(),
      ]);

      setRoles(rolesData.roles);
      setPermissions(permissionsData.permissions);

      // Load permissions for the first role by default
      if (rolesData.roles.length > 0) {
        setSelectedRole(rolesData.roles[0].id);
        await loadRolePermissions(rolesData.roles[0].id);
      }
    } catch (error) {
      console.error('Failed to load RBAC data:', error);
      toast.error('Failed to load access control data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRolePermissions = async (roleId: number) => {
    try {
      const data = await rbacAPI.getRolePermissions(roleId);
      setRolePermissions(prev => ({
        ...prev,
        [roleId]: data.permissions,
      }));
    } catch (error) {
      console.error('Failed to load role permissions:', error);
      toast.error('Failed to load role permissions');
    }
  };

  const handleRoleSelect = async (roleId: number) => {
    setSelectedRole(roleId);
    if (!rolePermissions[roleId]) {
      await loadRolePermissions(roleId);
    }
  };

  const hasPermission = (permissionId: number, mode: string = 'all'): RolePermission | undefined => {
    if (!selectedRole || !rolePermissions[selectedRole]) return undefined;
    return rolePermissions[selectedRole].find(
      rp => rp.permissionId === permissionId && (rp.mode === mode || rp.mode === 'all')
    );
  };

  const togglePermission = async (permissionId: number, mode: string = 'all') => {
    if (!selectedRole) return;

    const existing = hasPermission(permissionId, mode);
    const newAllow = !existing?.allow;

    setIsSaving(true);
    try {
      await rbacAPI.updateRolePermission(selectedRole, permissionId, mode, newAllow);
      
      // Reload role permissions
      await loadRolePermissions(selectedRole);
      toast.success('Permission updated');
    } catch (error) {
      console.error('Failed to update permission:', error);
      toast.error('Failed to update permission');
    } finally {
      setIsSaving(false);
    }
  };

  const clearCache = async () => {
    try {
      await rbacAPI.clearCache();
      toast.success('Permission cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedRoleData = roles.find(r => r.id === selectedRole);
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.group]) {
      acc[perm.group] = [];
    }
    acc[perm.group].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">Access Control</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Manage role permissions and access levels. Changes take effect immediately.
              </p>
            </div>
          </div>
          <button
            onClick={clearCache}
            className="inline-flex items-center px-3 py-1.5 border border-amber-300 dark:border-amber-700 rounded-md shadow-sm text-xs font-medium text-amber-700 dark:text-amber-300 bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Clear Cache
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Roles
            </h3>
            <div className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedRole === role.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium">{role.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{role.key}</div>
                  {role.permissionCount !== undefined && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {role.permissionCount} permissions
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-3">
          {selectedRoleData ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedRoleData.label} Permissions
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Configure which permissions this role has access to
                </p>
              </div>

              <div className="p-6 space-y-6">
                {Object.entries(groupedPermissions).map(([group, perms]) => (
                  <div key={group} className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      {group}
                    </h4>
                    <div className="space-y-2">
                      {perms.map((permission) => {
                        const hasAll = hasPermission(permission.id, 'all');
                        const hasTaskDoer = hasPermission(permission.id, 'taskDoer');
                        const hasTaskGiver = hasPermission(permission.id, 'taskGiver');

                        return (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {permission.label}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {permission.key}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* All Mode Toggle */}
                              <button
                                onClick={() => togglePermission(permission.id, 'all')}
                                disabled={isSaving}
                                className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                  hasAll?.allow
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                                title="All users"
                              >
                                {hasAll?.allow ? (
                                  <Check className="h-3 w-3 mr-1" />
                                ) : (
                                  <X className="h-3 w-3 mr-1" />
                                )}
                                All
                              </button>

                              {/* Task Doer Mode Toggle */}
                              <button
                                onClick={() => togglePermission(permission.id, 'taskDoer')}
                                disabled={isSaving}
                                className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                  hasTaskDoer?.allow || hasAll?.allow
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                                title="Task Doer mode"
                              >
                                {hasTaskDoer?.allow || hasAll?.allow ? (
                                  <Check className="h-3 w-3 mr-1" />
                                ) : (
                                  <X className="h-3 w-3 mr-1" />
                                )}
                                Doer
                              </button>

                              {/* Task Giver Mode Toggle */}
                              <button
                                onClick={() => togglePermission(permission.id, 'taskGiver')}
                                disabled={isSaving}
                                className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                  hasTaskGiver?.allow || hasAll?.allow
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                                title="Task Giver mode"
                              >
                                {hasTaskGiver?.allow || hasAll?.allow ? (
                                  <Check className="h-3 w-3 mr-1" />
                                ) : (
                                  <X className="h-3 w-3 mr-1" />
                                )}
                                Giver
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Select a role to view and manage permissions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessControlTab;
