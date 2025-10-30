import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, Save, RotateCcw, Loader2 } from 'lucide-react';
import { useRole } from '../../hooks/useRole';
import toast from 'react-hot-toast';

interface RolePermission {
    permission: string;
    label: string;
    description: string;
    superAdmin: boolean;
    admin: boolean;
    moderator: boolean;
}

interface PermissionsState {
    [key: string]: {
        superAdmin: boolean;
        admin: boolean;
        moderator: boolean;
    };
}

const AdminPanelAccessTab: React.FC = () => {
    const rolePermissions = useRole();
    const canEditPermissions = rolePermissions.canManageRoles;

    const [permissions, setPermissions] = useState<PermissionsState>({});
    const [originalPermissions, setOriginalPermissions] = useState<PermissionsState>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Define admin panel permissions by category
    const userManagement: RolePermission[] = [
        {
            permission: 'users.view',
            label: 'View Users',
            description: 'Can view user list and details',
            superAdmin: true,
            admin: true,
            moderator: true,
        },
        {
            permission: 'users.create',
            label: 'Create Users',
            description: 'Can create new user accounts',
            superAdmin: true,
            admin: true,
            moderator: false,
        },
        {
            permission: 'users.edit',
            label: 'Edit Users',
            description: 'Can edit user information and roles',
            superAdmin: true,
            admin: true,
            moderator: false,
        },
        {
            permission: 'users.suspend',
            label: 'Suspend Users',
            description: 'Can temporarily suspend user accounts',
            superAdmin: true,
            admin: true,
            moderator: true,
        },
        {
            permission: 'users.ban',
            label: 'Ban Users',
            description: 'Can permanently ban user accounts',
            superAdmin: true,
            admin: true,
            moderator: false,
        },
        {
            permission: 'balance.adjust',
            label: 'Adjust Balance',
            description: 'Can add or subtract user balance',
            superAdmin: true,
            admin: true,
            moderator: false,
        },
    ];

    const financialOperations: RolePermission[] = [
        {
            permission: 'transactions.view',
            label: 'View Transactions',
            description: 'Can view all transactions',
            superAdmin: true,
            admin: true,
            moderator: true,
        },
        {
            permission: 'transactions.approve',
            label: 'Approve Transactions',
            description: 'Can approve pending transactions',
            superAdmin: true,
            admin: true,
            moderator: false,
        },
        {
            permission: 'transactions.reject',
            label: 'Reject Transactions',
            description: 'Can reject pending transactions',
            superAdmin: true,
            admin: true,
            moderator: false,
        },
        {
            permission: 'withdrawals.view',
            label: 'View Withdrawals',
            description: 'Can view withdrawal requests',
            superAdmin: true,
            admin: true,
            moderator: true,
        },
        {
            permission: 'withdrawals.approve',
            label: 'Approve Withdrawals',
            description: 'Can approve withdrawal requests',
            superAdmin: true,
            admin: true,
            moderator: false,
        },
        {
            permission: 'withdrawals.reject',
            label: 'Reject Withdrawals',
            description: 'Can reject withdrawal requests',
            superAdmin: true,
            admin: true,
            moderator: false,
        },
    ];

    const taskManagement: RolePermission[] = [
        {
            permission: 'tasks.view',
            label: 'View Tasks',
            description: 'Can view all tasks',
            superAdmin: true,
            admin: true,
            moderator: true,
        },
        {
            permission: 'tasks.edit',
            label: 'Edit Tasks',
            description: 'Can edit task details',
            superAdmin: true,
            admin: true,
            moderator: false,
        },
        {
            permission: 'tasks.approve',
            label: 'Approve Tasks',
            description: 'Can approve completed tasks',
            superAdmin: true,
            admin: true,
            moderator: true,
        },
        {
            permission: 'tasks.reject',
            label: 'Reject Tasks',
            description: 'Can reject completed tasks',
            superAdmin: true,
            admin: true,
            moderator: true,
        },
        {
            permission: 'tasks.delete',
            label: 'Delete Tasks',
            description: 'Can delete tasks',
            superAdmin: true,
            admin: true,
            moderator: false,
        },
    ];

    const orderManagement: RolePermission[] = [
        {
            permission: 'orders.view',
            label: 'View Orders',
            description: 'Can view all orders',
            superAdmin: true,
            admin: true,
            moderator: true,
        },
        {
            permission: 'orders.edit',
            label: 'Edit Orders',
            description: 'Can edit order details',
            superAdmin: true,
            admin: true,
            moderator: false,
        },
        {
            permission: 'orders.cancel',
            label: 'Cancel Orders',
            description: 'Can cancel orders',
            superAdmin: true,
            admin: true,
            moderator: true,
        },
        {
            permission: 'orders.refund',
            label: 'Refund Orders',
            description: 'Can issue refunds',
            superAdmin: true,
            admin: true,
            moderator: false,
        },
    ];

    const systemManagement: RolePermission[] = [
        {
            permission: 'settings.view',
            label: 'View Settings',
            description: 'Can view system settings',
            superAdmin: true,
            admin: true,
            moderator: true,
        },
        {
            permission: 'settings.edit',
            label: 'Edit Settings',
            description: 'Can modify system settings',
            superAdmin: true,
            admin: true,
            moderator: false,
        },
        {
            permission: 'audit.view',
            label: 'View Audit Logs',
            description: 'Can view audit and activity logs',
            superAdmin: true,
            admin: true,
            moderator: true,
        },
        {
            permission: 'roles.manage',
            label: 'Manage Roles',
            description: 'Can create and modify roles',
            superAdmin: true,
            admin: false,
            moderator: false,
        },
    ];

    // Fetch current permissions from backend
    useEffect(() => {
        fetchPermissions();
    }, []);

    // Check for changes
    useEffect(() => {
        const hasAnyChanges = Object.keys(permissions).some(key => {
            const current = permissions[key];
            const original = originalPermissions[key];
            if (!original) return false;
            return (
                current.superAdmin !== original.superAdmin ||
                current.admin !== original.admin ||
                current.moderator !== original.moderator
            );
        });
        setHasChanges(hasAnyChanges);
    }, [permissions, originalPermissions]);

    const fetchPermissions = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/api/admin/admin-permissions', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            // Handle 403 Forbidden - user doesn't have permission
            if (response.status === 403) {
                console.warn('Access denied: Only super_admin can view admin permissions');
                setLoading(false);
                return; // Exit gracefully, the read-only banner will be shown
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch permissions: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Handle new API response format (grouped by role)
            const permissionsMap: PermissionsState = {};
            
            if (data.data && data.data.permissions) {
                // New format: { data: { permissions: { super_admin: [], admin: [], moderator: [] } } }
                const grouped = data.data.permissions;
                
                Object.keys(grouped).forEach(role => {
                    grouped[role].forEach((perm: any) => {
                        if (!permissionsMap[perm.permissionKey]) {
                            permissionsMap[perm.permissionKey] = {
                                superAdmin: false,
                                admin: false,
                                moderator: false,
                            };
                        }
                        if (role === 'super_admin') permissionsMap[perm.permissionKey].superAdmin = perm.allow;
                        if (role === 'admin') permissionsMap[perm.permissionKey].admin = perm.allow;
                        if (role === 'moderator') permissionsMap[perm.permissionKey].moderator = perm.allow;
                    });
                });
            } else if (data.permissions) {
                // Old format: { permissions: [{ role, permissions: [] }] }
                ['super_admin', 'admin', 'moderator'].forEach(role => {
                    const roleData = data.permissions.find((r: any) => r.role === role);
                    if (roleData) {
                        roleData.permissions.forEach((perm: any) => {
                            if (!permissionsMap[perm.permissionKey]) {
                                permissionsMap[perm.permissionKey] = {
                                    superAdmin: false,
                                    admin: false,
                                    moderator: false,
                                };
                            }
                            if (role === 'super_admin') permissionsMap[perm.permissionKey].superAdmin = perm.allow;
                            if (role === 'admin') permissionsMap[perm.permissionKey].admin = perm.allow;
                            if (role === 'moderator') permissionsMap[perm.permissionKey].moderator = perm.allow;
                        });
                    }
                });
            }

            setPermissions(permissionsMap);
            setOriginalPermissions(JSON.parse(JSON.stringify(permissionsMap)));
        } catch (error) {
            console.error('Error fetching permissions:', error);
            // Don't show error toast for 403 - it's expected for non-super-admins
            if (error instanceof Error && !error.message.includes('403')) {
                toast.error('Failed to load permissions from server');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (permission: string, role: 'superAdmin' | 'admin' | 'moderator') => {
        if (!canEditPermissions) {
            toast.error('You do not have permission to edit admin permissions');
            return;
        }

        setPermissions(prev => ({
            ...prev,
            [permission]: {
                ...prev[permission],
                [role]: !prev[permission]?.[role],
            },
        }));
    };

    const handleSave = async () => {
        if (!canEditPermissions) {
            toast.error('You do not have permission to edit admin permissions');
            return;
        }

        try {
            setSaving(true);

            // Prepare bulk update payload
            const updates: any[] = [];
            Object.keys(permissions).forEach(permissionKey => {
                const current = permissions[permissionKey];
                const original = originalPermissions[permissionKey];

                if (!original) return;

                // Check each role for changes
                if (current.superAdmin !== original.superAdmin) {
                    updates.push({
                        role: 'super_admin',
                        permissionKey,
                        allow: current.superAdmin,
                    });
                }
                if (current.admin !== original.admin) {
                    updates.push({
                        role: 'admin',
                        permissionKey,
                        allow: current.admin,
                    });
                }
                if (current.moderator !== original.moderator) {
                    updates.push({
                        role: 'moderator',
                        permissionKey,
                        allow: current.moderator,
                    });
                }
            });

            if (updates.length === 0) {
                toast.success('No changes to save');
                return;
            }

            const response = await fetch('http://localhost:3000/api/admin/admin-permissions/bulk-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ updates }),
            });

            if (!response.ok) throw new Error('Failed to save permissions');

            const data = await response.json();
            toast.success(`Successfully updated ${data.updated} permissions`);
            
            // Refresh permissions from backend
            await fetchPermissions();
        } catch (error) {
            console.error('Error saving permissions:', error);
            toast.error('Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (!canEditPermissions) return;
        setPermissions(JSON.parse(JSON.stringify(originalPermissions)));
        toast.success('Changes reset');
    };

    const renderPermissionCategory = (title: string, categoryPermissions: RolePermission[]) => (
        <div key={title} className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {title}
            </h4>
            <div className="space-y-2">
                {categoryPermissions.map((perm) => {
                    const currentPermission = permissions[perm.permission] || {
                        superAdmin: perm.superAdmin,
                        admin: perm.admin,
                        moderator: perm.moderator,
                    };

                    return (
                        <div
                            key={perm.permission}
                            className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                        >
                            <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {perm.label}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {perm.description}
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 ml-4">
                                {/* Super Admin Toggle */}
                                <label className="flex items-center space-x-2 cursor-pointer group">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">
                                        Super Admin
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleToggle(perm.permission, 'superAdmin')}
                                        disabled={!canEditPermissions || loading}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                            currentPermission.superAdmin
                                                ? 'bg-purple-600'
                                                : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                currentPermission.superAdmin ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </label>

                                {/* Admin Toggle */}
                                <label className="flex items-center space-x-2 cursor-pointer group">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">
                                        Admin
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleToggle(perm.permission, 'admin')}
                                        disabled={!canEditPermissions || loading}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                            currentPermission.admin
                                                ? 'bg-blue-600'
                                                : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                currentPermission.admin ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </label>

                                {/* Moderator Toggle */}
                                <label className="flex items-center space-x-2 cursor-pointer group">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">
                                        Moderator
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleToggle(perm.permission, 'moderator')}
                                        disabled={!canEditPermissions || loading}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                            currentPermission.moderator
                                                ? 'bg-green-600'
                                                : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                currentPermission.moderator ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading permissions...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Admin Panel Access Control
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Manage permissions for Admin Panel roles. These permissions control backend API access
                            dynamically through the database.
                        </p>
                    </div>
                </div>
            </div>

            {!canEditPermissions && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                Read-Only Mode
                            </h3>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                You do not have permission to view or edit admin permissions. Only Super Admins can access
                                this functionality. Showing default permission structure below.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {canEditPermissions && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-6 py-4">
                    <div className="flex items-center space-x-2">
                        {hasChanges && (
                            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                                You have unsaved changes
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleReset}
                            disabled={!hasChanges || saving}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Admin Panel Permissions Matrix
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Toggle permissions for each administrative role
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {renderPermissionCategory('User Management', userManagement)}
                    {renderPermissionCategory('Financial Operations', financialOperations)}
                    {renderPermissionCategory('Task Management', taskManagement)}
                    {renderPermissionCategory('Order Management', orderManagement)}
                    {renderPermissionCategory('System Management', systemManagement)}
                </div>
            </div>
        </div>
    );
};

export default AdminPanelAccessTab;
