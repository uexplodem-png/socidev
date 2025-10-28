import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Database,
  Shield,
  Globe,
  DollarSign,
  AlertTriangle,
  Lock,
  Bell,
  BarChart3,
  Zap,

} from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsAPI } from '../services/api';

interface SystemSettings {
  siteName: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotifications: boolean;
  taskAutoApproval: boolean;
  maxTasksPerUser: number;
  minWithdrawalAmount: number;
  withdrawalFee: number;
  currencies: string[];
  supportedPlatforms: string[];
  taskApprovalTimeoutHours: number;
  orderTimeoutHours: number;
  // Security settings
  twoFactorAuth: boolean;
  passwordMinLength: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  // Notification settings
  smsNotifications: boolean;
  pushNotifications: boolean;
  adminNotifications: boolean;
  userActivityNotifications: boolean;
  // Analytics settings
  enableAnalytics: boolean;
  analyticsRetentionDays: number;
  trackUserBehavior: boolean;
  // Performance settings
  cacheEnabled: boolean;
  cacheTTL: number;
  apiRateLimit: number;
  // Advanced settings
  debugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchSettings = async () => {
    try {
      const data = await settingsAPI.get();
      setSettings({
        // Base defaults
        siteName: data.siteName ?? 'SociDev',
        maintenanceMode: data.maintenanceMode ?? false,
        registrationEnabled: data.registrationEnabled ?? true,
        emailNotifications: data.emailNotifications ?? true,
        taskAutoApproval: data.taskAutoApproval ?? false,
        maxTasksPerUser: data.maxTasksPerUser ?? 10,
        taskApprovalTimeoutHours: data.taskApprovalTimeoutHours ?? 24,
        orderTimeoutHours: data.orderTimeoutHours ?? 48,
        minWithdrawalAmount: data.minWithdrawalAmount ?? 10,
        withdrawalFee: data.withdrawalFee ?? 0,
        currencies: data.currencies ?? ['USD'],
        supportedPlatforms: data.supportedPlatforms ?? [],
        // Security settings defaults
        twoFactorAuth: data.twoFactorAuth ?? false,
        passwordMinLength: data.passwordMinLength ?? 8,
        sessionTimeout: data.sessionTimeout ?? 30,
        maxLoginAttempts: data.maxLoginAttempts ?? 5,
        lockoutDuration: data.lockoutDuration ?? 30,
        // Notification settings defaults
        smsNotifications: data.smsNotifications ?? false,
        pushNotifications: data.pushNotifications ?? false,
        adminNotifications: data.adminNotifications ?? true,
        userActivityNotifications: data.userActivityNotifications ?? false,
        // Analytics settings defaults
        enableAnalytics: data.enableAnalytics ?? true,
        analyticsRetentionDays: data.analyticsRetentionDays ?? 90,
        trackUserBehavior: data.trackUserBehavior ?? true,
        // Performance settings defaults
        cacheEnabled: data.cacheEnabled ?? true,
        cacheTTL: data.cacheTTL ?? 300,
        apiRateLimit: data.apiRateLimit ?? 1000,
        // Advanced settings defaults
        debugMode: data.debugMode ?? false,
        logLevel: data.logLevel ?? 'info',
        autoBackup: data.autoBackup ?? true,
        backupFrequency: data.backupFrequency ?? 'daily'
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await settingsAPI.update(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm('Are you sure you want to reset all data to seed data? This action cannot be undone.')) {
      return;
    }

    setIsResetting(true);
    try {
      await settingsAPI.resetData();
      toast.success('Data reset successfully');
      // Reload the page to refresh all data
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset data:', error);
      toast.error('Failed to reset data');
    } finally {
      setIsResetting(false);
    }
  };

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const updateArraySetting = (key: keyof SystemSettings, index: number, value: string) => {
    if (!settings) return;
    const array = [...(settings[key] as string[])];
    array[index] = value;
    setSettings({ ...settings, [key]: array });
  };

  const addArrayItem = (key: keyof SystemSettings, value: string) => {
    if (!settings) return;
    const array = [...(settings[key] as string[]), value];
    setSettings({ ...settings, [key]: array });
  };

  const removeArrayItem = (key: keyof SystemSettings, index: number) => {
    if (!settings) return;
    const array = [...(settings[key] as string[])];
    array.splice(index, 1);
    setSettings({ ...settings, [key]: array });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) {
    return <div>Failed to load settings</div>;
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 dark:border-red-600 dark:text-red-300 dark:bg-gray-800 dark:hover:bg-red-900/20"
          >
            {isResetting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Reset to Seed Data
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white shadow border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <Globe className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">General Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => updateSetting('siteName', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="maintenance-mode"
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="maintenance-mode" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Maintenance Mode
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="registration-enabled"
                  type="checkbox"
                  checked={settings.registrationEnabled}
                  onChange={(e) => updateSetting('registrationEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="registration-enabled" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Allow User Registration
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="email-notifications"
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Enable Email Notifications
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white shadow border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <Lock className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Security Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="two-factor-auth"
                  type="checkbox"
                  checked={settings.twoFactorAuth}
                  onChange={(e) => updateSetting('twoFactorAuth', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="two-factor-auth" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Enable Two-Factor Authentication
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Minimum Password Length</label>
                <input
                  type="number"
                  min="6"
                  max="128"
                  value={settings.passwordMinLength}
                  onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Session Timeout (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Login Attempts</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lockout Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={settings.lockoutDuration}
                  onChange={(e) => updateSetting('lockoutDuration', parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Task Settings */}
        <div className="bg-white shadow border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <SettingsIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Task Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="task-auto-approval"
                  type="checkbox"
                  checked={settings.taskAutoApproval}
                  onChange={(e) => updateSetting('taskAutoApproval', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="task-auto-approval" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Enable Auto Task Approval
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Tasks Per User</label>
                <input
                  type="number"
                  value={settings.maxTasksPerUser}
                  onChange={(e) => updateSetting('maxTasksPerUser', parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Approval Timeout (hours)</label>
                <input
                  type="number"
                  value={settings.taskApprovalTimeoutHours}
                  onChange={(e) => updateSetting('taskApprovalTimeoutHours', parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Order Timeout (hours)</label>
                <input
                  type="number"
                  value={settings.orderTimeoutHours}
                  onChange={(e) => updateSetting('orderTimeoutHours', parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white shadow border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <Bell className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notification Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="sms-notifications"
                  type="checkbox"
                  checked={settings.smsNotifications}
                  onChange={(e) => updateSetting('smsNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="sms-notifications" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Enable SMS Notifications
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="push-notifications"
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => updateSetting('pushNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="push-notifications" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Enable Push Notifications
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="admin-notifications"
                  type="checkbox"
                  checked={settings.adminNotifications}
                  onChange={(e) => updateSetting('adminNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="admin-notifications" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Enable Admin Notifications
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="user-activity-notifications"
                  type="checkbox"
                  checked={settings.userActivityNotifications}
                  onChange={(e) => updateSetting('userActivityNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="user-activity-notifications" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Enable User Activity Notifications
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div className="bg-white shadow border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Financial Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Minimum Withdrawal Amount</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm dark:text-gray-400">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.minWithdrawalAmount}
                    onChange={(e) => updateSetting('minWithdrawalAmount', parseFloat(e.target.value))}
                    className="pl-7 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Withdrawal Fee</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    step="0.01"
                    value={settings.withdrawalFee}
                    onChange={(e) => updateSetting('withdrawalFee', parseFloat(e.target.value))}
                    className="pr-12 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm dark:text-gray-400">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Settings */}
        <div className="bg-white shadow border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Analytics Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="enable-analytics"
                  type="checkbox"
                  checked={settings.enableAnalytics}
                  onChange={(e) => updateSetting('enableAnalytics', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="enable-analytics" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Enable Analytics Tracking
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Retention (days)</label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={settings.analyticsRetentionDays}
                  onChange={(e) => updateSetting('analyticsRetentionDays', parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="track-user-behavior"
                  type="checkbox"
                  checked={settings.trackUserBehavior}
                  onChange={(e) => updateSetting('trackUserBehavior', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="track-user-behavior" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Track User Behavior
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Settings */}
        <div className="bg-white shadow border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <Zap className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Performance Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="cache-enabled"
                  type="checkbox"
                  checked={settings.cacheEnabled}
                  onChange={(e) => updateSetting('cacheEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="cache-enabled" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Enable Caching
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cache TTL (seconds)</label>
                <input
                  type="number"
                  min="1"
                  max="86400"
                  value={settings.cacheTTL}
                  onChange={(e) => updateSetting('cacheTTL', parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">API Rate Limit (requests/hour)</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={settings.apiRateLimit}
                  onChange={(e) => updateSetting('apiRateLimit', parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-white shadow border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <SettingsIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Advanced Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="debug-mode"
                  type="checkbox"
                  checked={settings.debugMode}
                  onChange={(e) => updateSetting('debugMode', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="debug-mode" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Enable Debug Mode
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Log Level</label>
                <select
                  value={settings.logLevel}
                  onChange={(e) => updateSetting('logLevel', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  id="auto-backup"
                  type="checkbox"
                  checked={settings.autoBackup}
                  onChange={(e) => updateSetting('autoBackup', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="auto-backup" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Enable Automatic Backups
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Backup Frequency</label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => updateSetting('backupFrequency', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Settings */}
        <div className="bg-white shadow border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Platform Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supported Currencies</label>
                <div className="space-y-2">
                  {settings.currencies.map((currency, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={currency}
                        onChange={(e) => updateArraySetting('currencies', index, e.target.value)}
                        className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={() => removeArrayItem('currencies', index)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayItem('currencies', 'NEW')}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    Add Currency
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supported Platforms</label>
                <div className="space-y-2">
                  {settings.supportedPlatforms.map((platform, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={platform}
                        onChange={(e) => updateArraySetting('supportedPlatforms', index, e.target.value)}
                        className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={() => removeArrayItem('supportedPlatforms', index)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayItem('supportedPlatforms', 'new_platform')}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    Add Platform
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Important Notice
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>
                Changes to system settings will take effect immediately.
                The "Reset to Seed Data" action will permanently delete all current data and restore the system to its initial state with demo data.
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;