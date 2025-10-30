import React from 'react';
import { Shield, AlertCircle, Check, X } from 'lucide-react';

interface RolePermission {
    permission: string;
    label: string;
    description: string;
    superAdmin: boolean;
    admin: boolean;
    moderator: boolean;
}

const AdminPanelAccessTab: React.FC = () => {
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

    const renderPermissionCategory = (title: string, permissions: RolePermission[]) => (
        <div key={title} className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {title}
            </h4>
            <div className="space-y-2">
                {permissions.map((perm) => (
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

                        <div className="flex items-center space-x-2 ml-4">
                            {/* Super Admin */}
                            <div
                                className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium ${
                                    perm.superAdmin
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500'
                                }`}
                                title="Super Admin"
                            >
                                {perm.superAdmin ? (
                                    <Check className="h-3 w-3 mr-1" />
                                ) : (
                                    <X className="h-3 w-3 mr-1" />
                                )}
                                Super Admin
                            </div>

                            {/* Admin */}
                            <div
                                className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium ${
                                    perm.admin
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500'
                                }`}
                                title="Admin"
                            >
                                {perm.admin ? (
                                    <Check className="h-3 w-3 mr-1" />
                                ) : (
                                    <X className="h-3 w-3 mr-1" />
                                )}
                                Admin
                            </div>

                            {/* Moderator */}
                            <div
                                className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium ${
                                    perm.moderator
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500'
                                }`}
                                title="Moderator"
                            >
                                {perm.moderator ? (
                                    <Check className="h-3 w-3 mr-1" />
                                ) : (
                                    <X className="h-3 w-3 mr-1" />
                                )}
                                Moderator
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

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
                            This page shows the permission matrix for Admin Panel roles. These permissions are
                            hardcoded and control backend API access via <code className="bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded text-xs">authorizeRoles</code> middleware.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Read-Only Display
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            This is a read-only view. Admin Panel role permissions are defined in the backend code and
                            cannot be modified through the UI. To change these permissions, update the{' '}
                            <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded text-xs">authorizeRoles</code>{' '}
                            middleware in the backend routes.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Admin Panel Permissions Matrix
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        View which administrative roles have access to specific operations
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
