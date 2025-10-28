import React from 'react';
import { Lock, Clock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccountLockedProps {
    lockedUntil?: string;
    attempts?: number;
}

export const AccountLocked: React.FC<AccountLockedProps> = ({ lockedUntil, attempts }) => {
    const navigate = useNavigate();

    const getTimeRemaining = () => {
        if (!lockedUntil) return 'temporarily';

        const now = new Date().getTime();
        const lockExpiry = new Date(lockedUntil).getTime();
        const diff = lockExpiry - now;

        if (diff <= 0) return 'Your account should be unlocked now';

        const minutes = Math.floor(diff / 1000 / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
        }
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="mx-auto h-24 w-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-12 w-12 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        Account Locked
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Your account has been temporarily locked due to too many failed login attempts
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">
                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <Clock className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                                    Security Lockout
                                </h3>
                                <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                                    <p>
                                        Your account will be automatically unlocked in <strong>{getTimeRemaining()}</strong>
                                    </p>
                                    {attempts && (
                                        <p className="mt-1">
                                            Failed attempts: <strong>{attempts}</strong>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Why was my account locked?
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                To protect your account from unauthorized access, we temporarily lock accounts after multiple failed login attempts.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                What should I do?
                            </h3>
                            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <li>Wait for the lockout period to expire</li>
                                <li>Make sure you're using the correct password</li>
                                <li>If you forgot your password, use the password reset option below</li>
                                <li>Enable two-factor authentication for added security</li>
                            </ul>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <Mail className="h-5 w-5 text-blue-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                        Need immediate access?
                                    </h3>
                                    <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                                        If you believe this was a mistake or you need urgent access, please contact our support team.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <button
                            onClick={() => navigate('/forgot-password')}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                            Reset Password
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                    This security measure helps protect your account from brute force attacks.
                </p>
            </div>
        </div>
    );
};

export default AccountLocked;
