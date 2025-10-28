import { create } from 'zustand';
import { settingsAPI } from '../services/api';

interface FeatureFlags {
    transactions: {
        enabled: boolean;
        createEnabled: boolean;
        approveEnabled: boolean;
        rejectEnabled: boolean;
        adjustEnabled: boolean;
    };
    users: {
        enabled: boolean;
        createEnabled: boolean;
        editEnabled: boolean;
        suspendEnabled: boolean;
        deleteEnabled: boolean;
    };
    orders: {
        enabled: boolean;
        createEnabled: boolean;
        editEnabled: boolean;
        refundEnabled: boolean;
        cancelEnabled: boolean;
    };
    tasks: {
        enabled: boolean;
        createEnabled: boolean;
        approveEnabled: boolean;
        rejectEnabled: boolean;
        deleteEnabled: boolean;
    };
}

interface Settings {
    features: FeatureFlags;
    general?: any;
    modes?: any;
    security?: any;
}

interface SettingsState {
    settings: Settings | null;
    isLoading: boolean;
    lastFetch: number;
    error: string | null;

    // Actions
    fetchSettings: () => Promise<void>;
    getFeatureFlag: (path: string) => boolean;
    refresh: () => Promise<void>;
}

const CACHE_DURATION = 60000; // 60 seconds

const defaultFeatureFlags: FeatureFlags = {
    transactions: {
        enabled: true,
        createEnabled: true,
        approveEnabled: true,
        rejectEnabled: true,
        adjustEnabled: true,
    },
    users: {
        enabled: true,
        createEnabled: true,
        editEnabled: true,
        suspendEnabled: true,
        deleteEnabled: true,
    },
    orders: {
        enabled: true,
        createEnabled: true,
        editEnabled: true,
        refundEnabled: true,
        cancelEnabled: true,
    },
    tasks: {
        enabled: true,
        createEnabled: true,
        approveEnabled: true,
        rejectEnabled: true,
        deleteEnabled: true,
    },
};

/**
 * Zustand store for system settings and feature flags.
 * Auto-refreshes every 60 seconds.
 * 
 * @example
 * const { getFeatureFlag } = useSettingsStore();
 * const canApprove = getFeatureFlag('features.transactions.approveEnabled');
 * 
 * if (!canApprove) {
 *   return <DisabledButton />;
 * }
 */
export const useSettingsStore = create<SettingsState>((set, get) => ({
    settings: null,
    isLoading: false,
    lastFetch: 0,
    error: null,

    fetchSettings: async () => {
        const state = get();
        const now = Date.now();

        // Use cached data if it's fresh
        if (state.settings && now - state.lastFetch < CACHE_DURATION) {
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const data = await settingsAPI.get();

            // Merge with defaults to ensure all flags exist
            const features: FeatureFlags = {
                transactions: {
                    ...defaultFeatureFlags.transactions,
                    ...(data.features?.transactions || {}),
                },
                users: {
                    ...defaultFeatureFlags.users,
                    ...(data.features?.users || {}),
                },
                orders: {
                    ...defaultFeatureFlags.orders,
                    ...(data.features?.orders || {}),
                },
                tasks: {
                    ...defaultFeatureFlags.tasks,
                    ...(data.features?.tasks || {}),
                },
            };

            set({
                settings: {
                    ...data,
                    features,
                },
                lastFetch: now,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to fetch settings',
                isLoading: false,
                // Use defaults on error
                settings: { features: defaultFeatureFlags },
                lastFetch: now,
            });
        }
    },

    getFeatureFlag: (path: string): boolean => {
        const state = get();

        // Trigger fetch if no settings or cache is stale
        if (!state.settings || Date.now() - state.lastFetch >= CACHE_DURATION) {
            // Non-blocking fetch
            state.fetchSettings();
        }

        if (!state.settings) {
            // Return true by default (permissive) while loading
            return true;
        }

        // Navigate path like 'features.transactions.approveEnabled'
        const parts = path.split('.');
        let value: any = state.settings;

        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            } else {
                // Path not found, return true (permissive default)
                return true;
            }
        }

        // Return the boolean value, default to true if not boolean
        return typeof value === 'boolean' ? value : true;
    },

    refresh: async () => {
        set({ lastFetch: 0 }); // Invalidate cache
        await get().fetchSettings();
    },
}));

// Auto-refresh settings every 60 seconds
if (typeof window !== 'undefined') {
    setInterval(() => {
        const state = useSettingsStore.getState();
        if (state.settings && Date.now() - state.lastFetch >= CACHE_DURATION) {
            state.fetchSettings();
        }
    }, CACHE_DURATION);
}
