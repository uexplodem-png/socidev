import { useState, useEffect } from 'react';

interface PublicSettings {
    maintenance: {
        enabled: boolean;
        message: string;
    };
    general: {
        siteName: string;
        allowRegistration: boolean;
    };
    security: {
        emailVerificationRequired: boolean;
        twoFactorRequired: boolean;
    };
}

interface Features {
    orders: {
        moduleEnabled: boolean;
        createEnabled: boolean;
        viewEnabled: boolean;
    };
    tasks: {
        moduleEnabled: boolean;
        createEnabled: boolean;
        viewEnabled: boolean;
        approvalRequired: boolean;
    };
    transactions: {
        moduleEnabled: boolean;
        depositsEnabled: boolean;
        withdrawalsEnabled: boolean;
    };
    users: {
        moduleEnabled: boolean;
        registrationEnabled: boolean;
    };
}

export const useFeatureFlags = (authenticated = false) => {
    const [settings, setSettings] = useState<PublicSettings | null>(null);
    const [features, setFeatures] = useState<Features | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();

        // Refresh every 5 minutes
        const interval = setInterval(fetchSettings, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [authenticated]);

    const fetchSettings = async () => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

            // Fetch public settings
            const publicResponse = await fetch(`${baseUrl}/api/settings/public`);
            if (publicResponse.ok) {
                const data = await publicResponse.json();
                setSettings(data.data);
            }

            // If authenticated, fetch feature flags
            if (authenticated) {
                const token = localStorage.getItem('token');
                if (token) {
                    const featuresResponse = await fetch(`${baseUrl}/api/settings/features`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (featuresResponse.ok) {
                        const data = await featuresResponse.json();
                        setFeatures(data.data);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const isFeatureEnabled = (module: 'orders' | 'tasks' | 'transactions' | 'users', action?: string): boolean => {
        // If features aren't loaded yet, assume enabled (fail open for better UX)
        if (!features) return true;

        const moduleFeatures = features[module];
        if (!moduleFeatures?.moduleEnabled) return false;

        // Check specific action if provided
        if (action && action in moduleFeatures) {
            return (moduleFeatures as any)[action] ?? true;
        }

        return true;
    };

    const isWithdrawalsEnabled = (): boolean => {
        return features?.transactions?.withdrawalsEnabled ?? true;
    };

    const isDepositsEnabled = (): boolean => {
        return features?.transactions?.depositsEnabled ?? true;
    };

    const isRegistrationAllowed = (): boolean => {
        return settings?.general?.allowRegistration ?? true;
    };

    const isMaintenanceMode = (): boolean => {
        return settings?.maintenance?.enabled ?? false;
    };

    const getMaintenanceMessage = (): string => {
        return settings?.maintenance?.message || 'The system is currently under maintenance.';
    };

    const isEmailVerificationRequired = (): boolean => {
        return settings?.security?.emailVerificationRequired ?? false;
    };

    const is2FARequired = (): boolean => {
        return settings?.security?.twoFactorRequired ?? false;
    };

    return {
        settings,
        features,
        loading,
        isFeatureEnabled,
        isWithdrawalsEnabled,
        isDepositsEnabled,
        isRegistrationAllowed,
        isMaintenanceMode,
        getMaintenanceMessage,
        isEmailVerificationRequired,
        is2FARequired,
    };
};
