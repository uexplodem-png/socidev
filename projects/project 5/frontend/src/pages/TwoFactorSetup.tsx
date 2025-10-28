import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Smartphone, Key, Copy, Download, Check } from 'lucide-react';

export const TwoFactorSetup: React.FC = () => {
    const [step, setStep] = useState<'setup' | 'verify'>('setup');
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setupTwoFactor();
    }, []);

    const setupTwoFactor = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/2fa/setup`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success) {
                setQrCode(data.data.qrCode);
                setSecret(data.data.secret);
                setBackupCodes(data.data.backupCodes);
            } else {
                setError(data.message || 'Failed to setup 2FA');
            }
        } catch (err) {
            setError('Failed to setup 2FA. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEnable2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/2fa/enable`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: verificationCode,
                    backupCodes,
                }),
            });

            const data = await response.json();
            if (data.success) {
                alert('2FA enabled successfully!');
                navigate('/settings');
            } else {
                setError(data.message || 'Invalid verification code');
            }
        } catch (err) {
            setError('Failed to enable 2FA. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copySecret = () => {
        navigator.clipboard.writeText(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadBackupCodes = () => {
        const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '2fa-backup-codes.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    if (loading && !qrCode) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <Shield className="mx-auto h-12 w-12 text-purple-600" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        Enable Two-Factor Authentication
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Add an extra layer of security to your account
                    </p>
                </div>

                {step === 'setup' ? (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                Step 1: Scan QR Code
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                            </p>
                            <div className="flex justify-center bg-white p-4 rounded-lg">
                                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Or enter this code manually:
                            </h3>
                            <div className="flex items-center space-x-2">
                                <code className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-mono text-sm">
                                    {secret}
                                </code>
                                <button
                                    onClick={copySecret}
                                    className="p-2 text-purple-600 hover:text-purple-700 dark:text-purple-400"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Step 2: Save Backup Codes
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Save these backup codes in a safe place. You can use them to access your account if you lose your phone.
                            </p>
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-2 font-mono text-sm text-gray-900 dark:text-white">
                                    {backupCodes.map((code, idx) => (
                                        <div key={idx}>{code}</div>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={downloadBackupCodes}
                                className="mt-3 w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download Backup Codes
                            </button>
                        </div>

                        <button
                            onClick={() => setStep('verify')}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                            Continue to Verification
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleEnable2FA} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                Step 3: Verify Setup
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Enter the 6-digit code from your authenticator app to complete setup
                            </p>
                            <div className="flex items-center space-x-2">
                                <Smartphone className="h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white text-center text-2xl font-mono tracking-widest"
                                    maxLength={6}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={() => setStep('setup')}
                                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={verificationCode.length !== 6 || loading}
                                className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verifying...' : 'Enable 2FA'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default TwoFactorSetup;
