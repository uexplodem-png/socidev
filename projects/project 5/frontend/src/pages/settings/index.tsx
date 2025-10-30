import { useState, useEffect } from 'react';
import {
    Lock, Bell, Globe, Eye, Shield, Mail, Save,
    XCircle, Key, Smartphone
} from 'lucide-react';
import { userApi, UserSettings } from '../../lib/api/user';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'account' | 'security' | 'notifications' | 'privacy' | 'api'>('account');
    const [settings, setSettings] = useState<UserSettings>({
        notifications: {
            email: true,
            browser: true,
        },
        privacy: {
            hideProfile: false,
            hideStats: false,
        },
        language: 'en',
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // API Key state
    const [apiKey, setApiKey] = useState<any>(null);
    const [showApiSecret, setShowApiSecret] = useState(false);
    const [generatingKey, setGeneratingKey] = useState(false);

    useEffect(() => {
        loadSettings();
        loadApiKey();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token') || '';
            const response = await userApi.getSettings(token);
            setSettings(response as UserSettings);
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadApiKey = async () => {
        try {
            const token = localStorage.getItem('token') || '';
            const response = await fetch('http://localhost:3000/api/user/api-key', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setApiKey(data.apiKey);
            }
        } catch (error) {
            console.error('Failed to load API key:', error);
        }
    };

    const generateApiKey = async () => {
        if (!confirm('Are you sure you want to generate an API key? You can only generate one API key per account.')) {
            return;
        }

        try {
            setGeneratingKey(true);
            const token = localStorage.getItem('token') || '';
            const response = await fetch('http://localhost:3000/api/user/api-key/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setApiKey(data.apiKey);
                setShowApiSecret(true);
                alert('API Key generated successfully! Make sure to save your API secret now - you will not be able to see it again.');
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to generate API key');
            }
        } catch (error) {
            console.error('Failed to generate API key:', error);
            alert('Failed to generate API key');
        } finally {
            setGeneratingKey(false);
        }
    };

    const regenerateSecret = async () => {
        if (!confirm('Are you sure you want to regenerate your API secret? Your old secret will no longer work.')) {
            return;
        }

        try {
            setGeneratingKey(true);
            const token = localStorage.getItem('token') || '';
            const response = await fetch('http://localhost:3000/api/user/api-key/regenerate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setApiKey(data.apiKey);
                setShowApiSecret(true);
                alert('API secret regenerated successfully! Make sure to save your new secret.');
            } else {
                alert('Failed to regenerate API secret');
            }
        } catch (error) {
            console.error('Failed to regenerate API secret:', error);
            alert('Failed to regenerate API secret');
        } finally {
            setGeneratingKey(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        alert(`${label} copied to clipboard!`);
    };

    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            const token = localStorage.getItem('token') || '';
            await userApi.updateSettings(token, settings);
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            alert('Password must be at least 8 characters long!');
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('token') || '';
            await userApi.updatePassword(token, {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            alert('Password changed successfully!');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Failed to change password:', error);
            alert('Failed to change password. Please check your current password.');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'account' as const, label: 'Account', icon: Globe },
        { id: 'security' as const, label: 'Security', icon: Shield },
        { id: 'notifications' as const, label: 'Notifications', icon: Bell },
        { id: 'privacy' as const, label: 'Privacy', icon: Eye },
        { id: 'api' as const, label: 'API', icon: Key },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
                    <p className="text-gray-600">Manage your account settings and preferences</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="border-b border-gray-200">
                        <div className="flex overflow-x-auto">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Account Settings */}
                        {activeTab === 'account' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Language Preferences</h2>
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Display Language
                                        </label>
                                        <select
                                            value={settings.language}
                                            onChange={(e) => setSettings({ ...settings, language: e.target.value as any })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        >
                                            <option value="en">English</option>
                                            <option value="tr">Türkçe</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSaveSettings}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50"
                                    >
                                        <Save className="w-5 h-5" />
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Security Settings */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Change Password</h2>
                                    <form onSubmit={handleChangePassword} className="space-y-4">
                                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Current Password
                                                </label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="password"
                                                        value={passwordForm.currentPassword}
                                                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                        placeholder="Enter current password"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    New Password
                                                </label>
                                                <div className="relative">
                                                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="password"
                                                        value={passwordForm.newPassword}
                                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                        placeholder="Enter new password"
                                                        required
                                                        minLength={8}
                                                    />
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">Must be at least 8 characters</p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Confirm New Password
                                                </label>
                                                <div className="relative">
                                                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="password"
                                                        value={passwordForm.confirmPassword}
                                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                        placeholder="Confirm new password"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50"
                                            >
                                                <Shield className="w-5 h-5" />
                                                {saving ? 'Updating...' : 'Update Password'}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Two-Factor Authentication</h3>
                                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-blue-100 rounded-lg">
                                                <Smartphone className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 mb-2">Coming Soon</h4>
                                                <p className="text-sm text-gray-600 mb-4">
                                                    Add an extra layer of security to your account with two-factor authentication.
                                                </p>
                                                <button
                                                    disabled
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg opacity-50 cursor-not-allowed"
                                                >
                                                    Enable 2FA
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Settings */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Preferences</h2>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 rounded-xl p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-start gap-3">
                                                    <Mail className="w-5 h-5 text-gray-600 mt-1" />
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Receive notifications about your orders and tasks via email
                                                        </p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.notifications?.email}
                                                        onChange={(e) => setSettings({
                                                            ...settings,
                                                            notifications: { ...settings.notifications!, email: e.target.checked }
                                                        })}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-14 h-7 bg-gray-300 peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-pink-600"></div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-xl p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-start gap-3">
                                                    <Bell className="w-5 h-5 text-gray-600 mt-1" />
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">Browser Notifications</h3>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Get instant browser notifications for important updates
                                                        </p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.notifications?.browser}
                                                        onChange={(e) => setSettings({
                                                            ...settings,
                                                            notifications: { ...settings.notifications!, browser: e.target.checked }
                                                        })}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-14 h-7 bg-gray-300 peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-pink-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSaveSettings}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50"
                                    >
                                        <Save className="w-5 h-5" />
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Privacy Settings */}
                        {activeTab === 'privacy' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Privacy Controls</h2>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 rounded-xl p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-start gap-3">
                                                    <Eye className="w-5 h-5 text-gray-600 mt-1" />
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">Hide Profile</h3>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Make your profile private and hidden from other users
                                                        </p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.privacy?.hideProfile}
                                                        onChange={(e) => setSettings({
                                                            ...settings,
                                                            privacy: { ...settings.privacy!, hideProfile: e.target.checked }
                                                        })}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-14 h-7 bg-gray-300 peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-pink-600"></div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-xl p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-start gap-3">
                                                    <XCircle className="w-5 h-5 text-gray-600 mt-1" />
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">Hide Statistics</h3>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Hide your task and order statistics from public view
                                                        </p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.privacy?.hideStats}
                                                        onChange={(e) => setSettings({
                                                            ...settings,
                                                            privacy: { ...settings.privacy!, hideStats: e.target.checked }
                                                        })}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-14 h-7 bg-gray-300 peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-pink-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSaveSettings}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50"
                                    >
                                        <Save className="w-5 h-5" />
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>

                                <div className="border-t pt-6">
                                    <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                                        <h3 className="text-lg font-bold text-red-900 mb-2">Danger Zone</h3>
                                        <p className="text-sm text-red-700 mb-4">
                                            Once you delete your account, there is no going back. Please be certain.
                                        </p>
                                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                                            Delete Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* API Settings */}
                        {activeTab === 'api' && (
                            <div className="space-y-6">
                                {!apiKey ? (
                                    <div className="text-center py-12">
                                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mb-6">
                                            <Key className="w-10 h-10 text-purple-600" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Generate Your API Key</h2>
                                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                            Create an API key to integrate our services with your applications.
                                            Each account can have only one active API key.
                                        </p>
                                        <button
                                            onClick={generateApiKey}
                                            disabled={generatingKey}
                                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Key className="w-5 h-5" />
                                            {generatingKey ? 'Generating...' : 'Generate API Key'}
                                        </button>
                                        <div className="mt-8 bg-blue-50 rounded-xl p-6 max-w-2xl mx-auto text-left border border-blue-200">
                                            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                                <Shield className="w-5 h-5" />
                                                Important Security Information
                                            </h3>
                                            <ul className="text-sm text-blue-800 space-y-2">
                                                <li>• Your API secret will only be shown once during generation</li>
                                                <li>• Store your API credentials in a secure location</li>
                                                <li>• Never share your API secret with anyone</li>
                                                <li>• You can regenerate your secret if needed</li>
                                                <li>• Rate limit: 1000 requests per day by default</li>
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">Your API Key</h2>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Use these credentials to authenticate API requests
                                                </p>
                                            </div>
                                            <div className={`px-4 py-2 rounded-lg ${
                                                apiKey.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : apiKey.status === 'suspended'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                <span className="font-medium capitalize">{apiKey.status}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {/* API Key */}
                                            <div className="bg-gray-50 rounded-xl p-6">
                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                    API Key
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <code className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-mono text-gray-900 break-all">
                                                        {apiKey.apiKey}
                                                    </code>
                                                    <button
                                                        onClick={() => copyToClipboard(apiKey.apiKey, 'API Key')}
                                                        className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all hover:scale-105 whitespace-nowrap"
                                                    >
                                                        Copy
                                                    </button>
                                                </div>
                                            </div>

                                            {/* API Secret - Only show if just generated */}
                                            {showApiSecret && apiKey.apiSecret && (
                                                <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-300">
                                                    <div className="flex items-start gap-3 mb-3">
                                                        <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                                                        <div className="flex-1">
                                                            <label className="block text-sm font-medium text-yellow-900 mb-1">
                                                                API Secret (Save this now!)
                                                            </label>
                                                            <p className="text-xs text-yellow-700 mb-3">
                                                                This is the only time you'll see your API secret. Make sure to save it securely!
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <code className="flex-1 px-4 py-3 bg-white border border-yellow-300 rounded-lg text-sm font-mono text-gray-900 break-all">
                                                            {apiKey.apiSecret}
                                                        </code>
                                                        <button
                                                            onClick={() => copyToClipboard(apiKey.apiSecret, 'API Secret')}
                                                            className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all hover:scale-105 whitespace-nowrap"
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* API Statistics */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                                    <div className="text-sm text-blue-700 mb-1">Created</div>
                                                    <div className="text-lg font-bold text-blue-900">
                                                        {new Date(apiKey.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                                                    <div className="text-sm text-green-700 mb-1">Total Requests</div>
                                                    <div className="text-lg font-bold text-green-900">
                                                        {apiKey.totalRequests?.toLocaleString() || 0}
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                                                    <div className="text-sm text-purple-700 mb-1">Rate Limit</div>
                                                    <div className="text-lg font-bold text-purple-900">
                                                        {apiKey.rateLimit?.toLocaleString() || 1000}/day
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Last Used */}
                                            {apiKey.lastUsedAt && (
                                                <div className="bg-gray-50 rounded-xl p-6">
                                                    <div className="text-sm text-gray-600 mb-1">Last Used</div>
                                                    <div className="text-base font-medium text-gray-900">
                                                        {new Date(apiKey.lastUsedAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-3 pt-4 border-t">
                                                <button
                                                    onClick={regenerateSecret}
                                                    disabled={generatingKey}
                                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50"
                                                >
                                                    <Key className="w-5 h-5" />
                                                    {generatingKey ? 'Regenerating...' : 'Regenerate Secret'}
                                                </button>

                                                <button
                                                    onClick={() => setShowApiSecret(!showApiSecret)}
                                                    className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                    {showApiSecret ? 'Hide' : 'Show'} Secret Warning
                                                </button>
                                            </div>
                                        </div>

                                        {/* API Documentation Link */}
                                        <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                                            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                <Globe className="w-5 h-5 text-purple-600" />
                                                API Documentation
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-4">
                                                Learn how to integrate our API into your applications and see available endpoints.
                                            </p>
                                            <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all hover:scale-105">
                                                View API Docs
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
