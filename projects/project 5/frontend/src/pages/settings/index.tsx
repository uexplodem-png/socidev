import { useState, useEffect } from 'react';
import {
    Lock, Bell, Globe, Eye, Shield, Mail, Save,
    XCircle, Key, Smartphone
} from 'lucide-react';
import { userApi, UserSettings } from '../../lib/api/user';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'account' | 'security' | 'notifications' | 'privacy'>('account');
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

    useEffect(() => {
        loadSettings();
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
                    </div>
                </div>
            </div>
        </div>
    );
}
