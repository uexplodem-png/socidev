import React, { useState, useEffect } from 'react';
import { Zap, DollarSign, Users, ShoppingCart, CheckSquare, RefreshCw } from 'lucide-react';
import { settingsAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface FeatureFlags {
    transactions: {
        enabled: boolean;
        approveEnabled: boolean;
        rejectEnabled: boolean;
        createEnabled: boolean;
        adjustEnabled: boolean;
    };
    users: {
        enabled: boolean;
        createEnabled: boolean;
        editEnabled: boolean;
        suspendEnabled: boolean;
        deleteEnabled: boolean;
    };
    orders: {
        enabled: boolean;
        createEnabled: boolean;
        editEnabled: boolean;
        refundEnabled: boolean;
        cancelEnabled: boolean;
    };
    tasks: {
        enabled: boolean;
        createEnabled: boolean;
        approveEnabled: boolean;
        rejectEnabled: boolean;
        editEnabled: boolean;
    };
}

const FeatureFlagsTab: React.FC = () => {
    const [flags, setFlags] = useState<FeatureFlags | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        loadFeatureFlags();
    }, []);

    const loadFeatureFlags = async () => {
        try {
            const settings = await settingsAPI.get();
            setFlags({
                transactions: settings.features?.transactions || {
                    enabled: true,
                    approveEnabled: true,
                    rejectEnabled: true,
                    createEnabled: true,
                    adjustEnabled: true,
                },
                users: settings.features?.users || {
                    enabled: true,
                    createEnabled: true,
                    editEnabled: true,
                    suspendEnabled: true,
                    deleteEnabled: false,
                },
                orders: settings.features?.orders || {
                    enabled: true,
                    createEnabled: true,
                    editEnabled: true,
                    refundEnabled: true,
                    cancelEnabled: true,
                },
                tasks: settings.features?.tasks || {
                    enabled: true,
                    createEnabled: true,
                    approveEnabled: true,
                    rejectEnabled: true,
                    editEnabled: true,
                },
            });
        } catch (error) {
            console.error('Failed to load feature flags:', error);
            toast.error('Failed to load feature flags');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await loadFeatureFlags();
            toast.success('Feature flags refreshed');
        } catch (error) {
            console.error('Failed to refresh feature flags:', error);
            toast.error('Failed to refresh feature flags');
        } finally {
            setIsRefreshing(false);
        }
    };

    const updateFlag = async (category: keyof FeatureFlags, key: string, value: boolean) => {
        if (!flags) return;

        const newFlags = {
            ...flags,
            [category]: {
                ...flags[category],
                [key]: value,
            },
        };
        setFlags(newFlags);

        // Save to backend
        setIsSaving(true);
        try {
            await settingsAPI.update(`features.${category}`, newFlags[category]);
            // Refresh data from server to ensure UI is synced
            await loadFeatureFlags();
            toast.success('Feature flag updated successfully');
        } catch (error) {
            console.error('Failed to update feature flag:', error);
            toast.error('Failed to update feature flag');
            // Revert on error
            loadFeatureFlags();
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!flags) {
        return <div className="text-gray-600 dark:text-gray-400">Failed to load feature flags</div>;
    }

    const renderFeatureSection = (
        icon: React.ReactNode,
        title: string,
        category: keyof FeatureFlags,
        features: { key: string; label: string; description: string }[]
    ) => (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center mb-4">
                {icon}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-2">{title}</h3>
            </div>
            <div className="space-y-4">
                {features.map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {label}
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
                        </div>
                        <button
                            onClick={() => updateFlag(category, key, !flags[category][key as keyof typeof flags[typeof category]])}
                            disabled={isSaving}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${flags[category][key as keyof typeof flags[typeof category]]
                                    ? 'bg-blue-600'
                                    : 'bg-gray-200 dark:bg-gray-700'
                                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flags[category][key as keyof typeof flags[typeof category]] ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start">
                        <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Feature Flags</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                Enable or disable features across the platform. Disabled features will return a 403 error when accessed.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="inline-flex items-center px-3 py-1.5 border border-blue-300 dark:border-blue-700 rounded-md text-sm font-medium text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Refresh feature flags from server"
                    >
                        <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderFeatureSection(
                    <DollarSign className="h-5 w-5 text-gray-400" />,
                    'Transactions',
                    'transactions',
                    [
                        { key: 'enabled', label: 'Transactions Module', description: 'Enable the entire transactions module' },
                        { key: 'approveEnabled', label: 'Approve Transactions', description: 'Allow approving pending transactions' },
                        { key: 'rejectEnabled', label: 'Reject Transactions', description: 'Allow rejecting pending transactions' },
                        { key: 'createEnabled', label: 'Create Manual Transactions', description: 'Allow creating manual transactions' },
                        { key: 'adjustEnabled', label: 'Adjust Balances', description: 'Allow adjusting user balances' },
                    ]
                )}

                {renderFeatureSection(
                    <Users className="h-5 w-5 text-gray-400" />,
                    'Users',
                    'users',
                    [
                        { key: 'enabled', label: 'Users Module', description: 'Enable the entire users module' },
                        { key: 'createEnabled', label: 'Create Users', description: 'Allow creating new users' },
                        { key: 'editEnabled', label: 'Edit Users', description: 'Allow editing user information' },
                        { key: 'suspendEnabled', label: 'Suspend Users', description: 'Allow suspending user accounts' },
                        { key: 'deleteEnabled', label: 'Delete Users', description: 'Allow deleting user accounts' },
                    ]
                )}

                {renderFeatureSection(
                    <ShoppingCart className="h-5 w-5 text-gray-400" />,
                    'Orders',
                    'orders',
                    [
                        { key: 'enabled', label: 'Orders Module', description: 'Enable the entire orders module' },
                        { key: 'createEnabled', label: 'Create Orders', description: 'Allow creating new orders' },
                        { key: 'editEnabled', label: 'Edit Orders', description: 'Allow editing order status' },
                        { key: 'refundEnabled', label: 'Refund Orders', description: 'Allow refunding orders' },
                        { key: 'cancelEnabled', label: 'Cancel Orders', description: 'Allow canceling orders' },
                    ]
                )}

                {renderFeatureSection(
                    <CheckSquare className="h-5 w-5 text-gray-400" />,
                    'Tasks',
                    'tasks',
                    [
                        { key: 'enabled', label: 'Tasks Module', description: 'Enable the entire tasks module' },
                        { key: 'createEnabled', label: 'Create Tasks', description: 'Allow creating new tasks' },
                        { key: 'approveEnabled', label: 'Approve Tasks', description: 'Allow approving pending tasks' },
                        { key: 'rejectEnabled', label: 'Reject Tasks', description: 'Allow rejecting pending tasks' },
                        { key: 'editEnabled', label: 'Edit Tasks', description: 'Allow editing task information' },
                    ]
                )}
            </div>
        </div>
    );
};

export default FeatureFlagsTab;
