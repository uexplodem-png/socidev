import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import {
  Settings,
  Save,
  AlertCircle,
  Lock,
  Shield,
  Trash2,
  X,
} from 'lucide-react';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AccountSettings) => void;
  onDelete: () => void;
  platform: 'instagram' | 'youtube';
  account: {
    id: string;
    username: string;
  };
}

interface AccountSettings {
  autoRenew: boolean;
  maxDailyTasks: number;
  notifications: {
    email: boolean;
    browser: boolean;
  };
  privacy: {
    hideStats: boolean;
    privateProfile: boolean;
  };
}

const defaultSettings: AccountSettings = {
  autoRenew: true,
  maxDailyTasks: 10,
  notifications: {
    email: true,
    browser: true,
  },
  privacy: {
    hideStats: false,
    privateProfile: false,
  },
};

export const AccountSettingsModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  platform,
  account,
}: AccountSettingsModalProps) => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<AccountSettings>(defaultSettings);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleDelete = () => {
    if (deleteConfirmText === account.username) {
      onDelete();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('deviceSettings')}
    >
      <div className="space-y-6">
        {/* Account Info */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">{account.username}</h3>
            <p className="text-sm text-gray-500">{account.id}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            platform === 'instagram'
              ? 'bg-pink-100 text-pink-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {platform === 'instagram' ? t('instagramAccount') : t('youtubeChannel')}
          </div>
        </div>

        {/* Task Settings */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">{t('taskSettings')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('autoStart')}
                </label>
                <p className="text-xs text-gray-500">
                  {t('autoStartDescription')}
                </p>
              </div>
              <div className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  checked={settings.autoRenew}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    autoRenew: e.target.checked
                  }))}
                  className="sr-only"
                />
                <div
                  className={`block w-12 h-6 rounded-full transition-colors ${
                    settings.autoRenew ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
                <div
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${
                    settings.autoRenew ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('maxConcurrentTasks')}
              </label>
              <input
                type="number"
                value={settings.maxDailyTasks}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  maxDailyTasks: parseInt(e.target.value)
                }))}
                min="1"
                max="50"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-200"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">{t('notificationSettings')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('emailNotifications')}
                </label>
                <p className="text-xs text-gray-500">
                  {t('emailNotificationsDescription')}
                </p>
              </div>
              <div className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      email: e.target.checked
                    }
                  }))}
                  className="sr-only"
                />
                <div
                  className={`block w-12 h-6 rounded-full transition-colors ${
                    settings.notifications.email ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
                <div
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${
                    settings.notifications.email ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('browserNotifications')}
                </label>
                <p className="text-xs text-gray-500">
                  {t('browserNotificationsDescription')}
                </p>
              </div>
              <div className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  checked={settings.notifications.browser}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      browser: e.target.checked
                    }
                  }))}
                  className="sr-only"
                />
                <div
                  className={`block w-12 h-6 rounded-full transition-colors ${
                    settings.notifications.browser ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
                <div
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${
                    settings.notifications.browser ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Delete Account */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-600">{t('deleteAccount')}</h3>
              <p className="text-xs text-gray-500">
                {t('deleteWarning')}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('delete')}
            </Button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('confirmDelete')}</h3>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('warning')}</p>
                    <p className="text-sm mt-1">
                      {t('deleteWarning')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('typeToConfirm', { deviceName: account.username })}
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-red-200"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={deleteConfirmText !== account.username}
                    className="bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300"
                  >
                    {t('deleteAccount')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={onClose}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {t('saveChanges')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};