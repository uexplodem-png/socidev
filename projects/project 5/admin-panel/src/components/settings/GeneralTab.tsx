import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsAPI } from '../../services/api';

interface GeneralSettings {
    siteName: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    emailNotifications: boolean;
    maxTasksPerUser: number;
    minWithdrawalAmount: number;
    withdrawalFee: number;
}

const GeneralTab: React.FC = () => {
    const [settings, setSettings] = useState<GeneralSettings>({
        siteName: 'SociDev',
        maintenanceMode: false,
        registrationEnabled: true,
        emailNotifications: true,
        maxTasksPerUser: 10,
        minWithdrawalAmount: 10,
        withdrawalFee: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await settingsAPI.get();
            setSettings({
                siteName: data.siteName ?? 'SociDev',
                maintenanceMode: data.maintenanceMode ?? false,
                registrationEnabled: data.registrationEnabled ?? true,
                emailNotifications: data.emailNotifications ?? true,
                maxTasksPerUser: data.maxTasksPerUser ?? 10,
                minWithdrawalAmount: data.minWithdrawalAmount ?? 10,
                withdrawalFee: data.withdrawalFee ?? 0,
            });
        } catch (error) {
            console.error('Failed to load general settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await loadSettings();
            toast.success('Settings refreshed successfully');
        } catch (error) {
            console.error('Failed to refresh settings:', error);
            toast.error('Failed to refresh settings');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await settingsAPI.update('general', settings);
            toast.success('General settings saved successfully');
            // Refetch updated data from server
            await loadSettings();
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const updateSetting = (key: keyof GeneralSettings, value: any) => {
        setSettings({ ...settings, [key]: value });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                            General System Settings
                        </h3>
                        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                            Configure basic system settings like site name, registration, and financial settings.
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="ml-4 inline-flex items-center px-3 py-1.5 border border-blue-300 dark:border-blue-700 rounded-md text-sm font-medium text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Refresh settings from server"
                    >
                        <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Site Configuration */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-4">
                        <Globe className="h-5 w-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Site Configuration
                        </h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Site Name
                            </label>
                            <input
                                type="text"
                                value={settings.siteName}
                                onChange={(e) => updateSetting('siteName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    Maintenance Mode
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Disable site access for maintenance
                                </p>
                            </div>
                            <button
                                onClick={() => updateSetting('maintenanceMode', !settings.maintenanceMode)}
                                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.maintenanceMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
                            >
                                <span
                                    className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}
                  `}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    Registration Enabled
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Allow new user registration
                                </p>
                            </div>
                            <button
                                onClick={() => updateSetting('registrationEnabled', !settings.registrationEnabled)}
                                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.registrationEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
                            >
                                <span
                                    className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.registrationEnabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    Email Notifications
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Send email notifications to users
                                </p>
                            </div>
                            <button
                                onClick={() => updateSetting('emailNotifications', !settings.emailNotifications)}
                                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
                            >
                                <span
                                    className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'}
                  `}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Task & Financial Settings */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Task & Financial Settings
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Max Tasks Per User
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={settings.maxTasksPerUser}
                                onChange={(e) => updateSetting('maxTasksPerUser', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Maximum concurrent tasks a user can have
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Minimum Withdrawal Amount ($)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={settings.minWithdrawalAmount}
                                onChange={(e) => updateSetting('minWithdrawalAmount', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Minimum amount users can withdraw
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Withdrawal Fee (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={settings.withdrawalFee}
                                onChange={(e) => updateSetting('withdrawalFee', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Percentage fee charged on withdrawals
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </button>
            </div>
        </div>
    );
};

export default GeneralTab;
