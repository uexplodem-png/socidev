import React, { useState, useEffect } from 'react';
import { Lock, RefreshCw, AlertCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsAPI } from '../../services/api';

interface SecuritySettings {
    twoFactorAuth: boolean;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSymbols: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    requireEmailVerification: boolean;
    allowPasswordReset: boolean;
}

const SecurityTab: React.FC = () => {
    const [settings, setSettings] = useState<SecuritySettings>({
        twoFactorAuth: false,
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireNumbers: true,
        passwordRequireSymbols: false,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        lockoutDuration: 30,
        requireEmailVerification: true,
        allowPasswordReset: true,
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
                twoFactorAuth: data.security?.twoFactorAuth ?? false,
                passwordMinLength: data.security?.passwordMinLength ?? 8,
                passwordRequireUppercase: data.security?.passwordRequireUppercase ?? true,
                passwordRequireNumbers: data.security?.passwordRequireNumbers ?? true,
                passwordRequireSymbols: data.security?.passwordRequireSymbols ?? false,
                sessionTimeout: data.security?.sessionTimeout ?? 30,
                maxLoginAttempts: data.security?.maxLoginAttempts ?? 5,
                lockoutDuration: data.security?.lockoutDuration ?? 30,
                requireEmailVerification: data.security?.requireEmailVerification ?? true,
                allowPasswordReset: data.security?.allowPasswordReset ?? true,
            });
        } catch (error) {
            console.error('Failed to load security settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await loadSettings();
            toast.success('Security settings refreshed');
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
            await settingsAPI.update('security', settings);
            // Refresh data from server to ensure UI is synced
            await loadSettings();
            toast.success('Security settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const updateSetting = (key: keyof SecuritySettings, value: any) => {
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
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                Security Configuration
                            </h3>
                            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                                Configure authentication, password policies, and session management settings. Changes affect all users.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="inline-flex items-center px-3 py-1.5 border border-amber-300 dark:border-amber-700 rounded-md text-sm font-medium text-amber-700 dark:text-amber-300 bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Refresh settings from server"
                    >
                        <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Authentication Settings */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-4">
                        <Shield className="h-5 w-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Authentication
                        </h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    Two-Factor Authentication
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Require 2FA for all users
                                </p>
                            </div>
                            <button
                                onClick={() => updateSetting('twoFactorAuth', !settings.twoFactorAuth)}
                                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
                            >
                                <span
                                    className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'}
                  `}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    Require Email Verification
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Users must verify email to activate account
                                </p>
                            </div>
                            <button
                                onClick={() => updateSetting('requireEmailVerification', !settings.requireEmailVerification)}
                                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.requireEmailVerification ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
                            >
                                <span
                                    className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.requireEmailVerification ? 'translate-x-6' : 'translate-x-1'}
                  `}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    Allow Password Reset
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Users can reset forgotten passwords
                                </p>
                            </div>
                            <button
                                onClick={() => updateSetting('allowPasswordReset', !settings.allowPasswordReset)}
                                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.allowPasswordReset ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
                            >
                                <span
                                    className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.allowPasswordReset ? 'translate-x-6' : 'translate-x-1'}
                  `}
                                />
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Session Timeout (minutes)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="1440"
                                value={settings.sessionTimeout}
                                onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Inactive sessions will be logged out
                            </p>
                        </div>
                    </div>
                </div>

                {/* Password Policy */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-4">
                        <Lock className="h-5 w-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Password Policy
                        </h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Minimum Password Length
                            </label>
                            <input
                                type="number"
                                min="6"
                                max="128"
                                value={settings.passwordMinLength}
                                onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Minimum 6 characters recommended
                            </p>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    Require Uppercase
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    At least one uppercase letter
                                </p>
                            </div>
                            <button
                                onClick={() => updateSetting('passwordRequireUppercase', !settings.passwordRequireUppercase)}
                                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.passwordRequireUppercase ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
                            >
                                <span
                                    className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.passwordRequireUppercase ? 'translate-x-6' : 'translate-x-1'}
                  `}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    Require Numbers
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    At least one numeric digit
                                </p>
                            </div>
                            <button
                                onClick={() => updateSetting('passwordRequireNumbers', !settings.passwordRequireNumbers)}
                                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.passwordRequireNumbers ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
                            >
                                <span
                                    className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.passwordRequireNumbers ? 'translate-x-6' : 'translate-x-1'}
                  `}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    Require Symbols
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    At least one special character
                                </p>
                            </div>
                            <button
                                onClick={() => updateSetting('passwordRequireSymbols', !settings.passwordRequireSymbols)}
                                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.passwordRequireSymbols ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
                            >
                                <span
                                    className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.passwordRequireSymbols ? 'translate-x-6' : 'translate-x-1'}
                  `}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account Protection */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Account Protection
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Max Login Attempts
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={settings.maxLoginAttempts}
                                onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Failed attempts before lockout
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Lockout Duration (minutes)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="1440"
                                value={settings.lockoutDuration}
                                onChange={(e) => updateSetting('lockoutDuration', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                How long accounts are locked
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

export default SecurityTab;
