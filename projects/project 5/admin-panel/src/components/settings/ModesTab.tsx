import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsAPI } from '../../services/api';

interface ModesSettings {
  defaultMode: 'taskDoer' | 'taskGiver';
  allowModeSwitching: boolean;
  taskDoerEnabled: boolean;
  taskGiverEnabled: boolean;
  requireVerificationForGiver: boolean;
  minBalanceForGiver: number;
}

const ModesTab: React.FC = () => {
  const [settings, setSettings] = useState<ModesSettings>({
    defaultMode: 'taskDoer',
    allowModeSwitching: true,
    taskDoerEnabled: true,
    taskGiverEnabled: true,
    requireVerificationForGiver: false,
    minBalanceForGiver: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsAPI.get();
      setSettings({
        defaultMode: data.modes?.defaultMode ?? 'taskDoer',
        allowModeSwitching: data.modes?.allowModeSwitching ?? true,
        taskDoerEnabled: data.modes?.taskDoerEnabled ?? true,
        taskGiverEnabled: data.modes?.taskGiverEnabled ?? true,
        requireVerificationForGiver: data.modes?.requireVerificationForGiver ?? false,
        minBalanceForGiver: data.modes?.minBalanceForGiver ?? 0,
      });
    } catch (error) {
      console.error('Failed to load modes settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await settingsAPI.update('modes', settings);
      toast.success('Modes settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof ModesSettings, value: any) => {
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
              User Mode Configuration
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Configure how users can switch between Task Doer (worker) and Task Giver (creator) modes.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mode Settings */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Sliders className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Mode Settings
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Mode for New Users
              </label>
              <select
                value={settings.defaultMode}
                onChange={(e) => updateSetting('defaultMode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="taskDoer">Task Doer (Worker)</option>
                <option value="taskGiver">Task Giver (Creator)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The mode users start with when they sign up
              </p>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Allow Mode Switching
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Users can switch between modes
                </p>
              </div>
              <button
                onClick={() => updateSetting('allowModeSwitching', !settings.allowModeSwitching)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.allowModeSwitching ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.allowModeSwitching ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Task Doer Mode Enabled
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow users to work on tasks
                </p>
              </div>
              <button
                onClick={() => updateSetting('taskDoerEnabled', !settings.taskDoerEnabled)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.taskDoerEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.taskDoerEnabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Task Giver Mode Enabled
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow users to create tasks
                </p>
              </div>
              <button
                onClick={() => updateSetting('taskGiverEnabled', !settings.taskGiverEnabled)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.taskGiverEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.taskGiverEnabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Task Giver Requirements */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Task Giver Requirements
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Require Verification
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Users must verify identity to create tasks
                </p>
              </div>
              <button
                onClick={() => updateSetting('requireVerificationForGiver', !settings.requireVerificationForGiver)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.requireVerificationForGiver ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.requireVerificationForGiver ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Minimum Balance Required ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.minBalanceForGiver}
                onChange={(e) => updateSetting('minBalanceForGiver', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minimum balance to create tasks (set 0 to disable)
              </p>
            </div>

            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-green-900 dark:text-green-200">
                    Mode Best Practices
                  </h4>
                  <ul className="mt-2 text-xs text-green-700 dark:text-green-300 space-y-1">
                    <li>• Enable mode switching for flexibility</li>
                    <li>• Consider requiring verification for Task Givers</li>
                    <li>• Set minimum balance to prevent spam tasks</li>
                  </ul>
                </div>
              </div>
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

export default ModesTab;
