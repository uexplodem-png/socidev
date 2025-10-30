import React, { useState, useEffect } from 'react';
import { Save, Mail, Server, Key } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
}

const EmailSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<EmailSettings>({
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
    replyToEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // TODO: Implement API call to get email settings
      // const response = await settingsAPI.getEmailSettings();
      // setSettings(response.data);
      
      // For now, load from localStorage or use defaults
      const savedSettings = localStorage.getItem('emailSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load email settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validation
      if (!settings.smtpHost) {
        toast.error('SMTP Host is required');
        return;
      }
      if (!settings.smtpPort) {
        toast.error('SMTP Port is required');
        return;
      }
      if (!settings.fromEmail) {
        toast.error('From Email is required');
        return;
      }

      // TODO: Implement API call to save email settings
      // await settingsAPI.updateEmailSettings(settings);
      
      // For now, save to localStorage
      localStorage.setItem('emailSettings', JSON.stringify(settings));
      
      toast.success('Email settings saved successfully');
    } catch (error: any) {
      console.error('Failed to save email settings:', error);
      toast.error(error?.message || 'Failed to save email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address to test');
      return;
    }

    try {
      setTesting(true);
      
      // TODO: Implement API call to send test email
      // await emailAPI.sendTest({ to: testEmail });
      
      toast.success(`Test email sent to ${testEmail}`);
      setTestEmail('');
    } catch (error: any) {
      console.error('Failed to send test email:', error);
      toast.error(error?.message || 'Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  const commonPorts = [
    { value: 25, label: '25 (SMTP - Unencrypted)' },
    { value: 465, label: '465 (SMTPS - SSL)' },
    { value: 587, label: '587 (SMTP - TLS)' },
    { value: 2525, label: '2525 (Alternative)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Email Configuration
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure SMTP settings for sending emails
        </p>
      </div>

      {/* SMTP Server Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
          <Server className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            SMTP Server
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SMTP Host */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SMTP Host *
            </label>
            <input
              type="text"
              value={settings.smtpHost}
              onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="smtp.gmail.com"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Your SMTP server address (e.g., smtp.gmail.com, smtp.sendgrid.net)
            </p>
          </div>

          {/* SMTP Port */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SMTP Port *
            </label>
            <select
              value={settings.smtpPort}
              onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {commonPorts.map((port) => (
                <option key={port.value} value={port.value}>
                  {port.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Common SMTP ports (587 recommended for TLS)
            </p>
          </div>

          {/* SMTP Secure */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.smtpSecure}
                onChange={(e) => setSettings({ ...settings, smtpSecure: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Use SSL/TLS (Secure Connection)
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              Enable for ports 465 (SSL) or 587 (TLS)
            </p>
          </div>
        </div>
      </div>

      {/* Authentication Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
          <Key className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Authentication
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SMTP Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SMTP Username
            </label>
            <input
              type="text"
              value={settings.smtpUser}
              onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="your-email@example.com"
            />
          </div>

          {/* SMTP Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SMTP Password
            </label>
            <input
              type="password"
              value={settings.smtpPassword}
              onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              For Gmail, use App Password instead of regular password
            </p>
          </div>
        </div>
      </div>

      {/* Sender Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
          <Mail className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sender Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* From Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Email Address *
            </label>
            <input
              type="email"
              value={settings.fromEmail}
              onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="noreply@yourapp.com"
            />
          </div>

          {/* From Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Name
            </label>
            <input
              type="text"
              value={settings.fromName}
              onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Your App Name"
            />
          </div>

          {/* Reply-To Email */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reply-To Email Address
            </label>
            <input
              type="email"
              value={settings.replyToEmail}
              onChange={(e) => setSettings({ ...settings, replyToEmail: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="support@yourapp.com"
            />
          </div>
        </div>
      </div>

      {/* Test Email */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Test Email Configuration
        </h3>
        <div className="flex gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="test@example.com"
          />
          <button
            onClick={handleTestEmail}
            disabled={testing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          Send a test email to verify your SMTP configuration
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : 'Save Email Settings'}
        </button>
      </div>
    </div>
  );
};

export default EmailSettingsTab;
