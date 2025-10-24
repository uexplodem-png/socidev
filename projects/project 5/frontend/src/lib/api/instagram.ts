import { fetchApi } from "../api";

export interface InstagramAccount {
  id: string;
  username: string;
  status: "active" | "inactive" | "limited";
  totalFollowed: number;
  totalLikes: number;
  totalComments: number;
  totalEarnings: string | number;
  lastActivity?: string;
  stats?: {
    totalFollowed: number;
    totalEarnings: number;
    recentFollowed: number;
    recentEarnings: number;
    lastActivity: string;
  };
  settings: {
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
  };
}

export interface AddAccountData {
  username: string;
  password: string;
}

export interface UpdateSettingsData {
  autoRenew?: boolean;
  maxDailyTasks?: number;
  notifications?: {
    email: boolean;
    browser: boolean;
  };
  privacy?: {
    hideStats: boolean;
    privateProfile: boolean;
  };
}

export const instagramApi = {
  // Add Instagram account
  addAccount: (
    token: string,
    data: AddAccountData
  ): Promise<InstagramAccount> =>
    fetchApi("/social-accounts", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    }),

  // Get user's Instagram accounts
  getAccounts: (token: string): Promise<InstagramAccount[]> =>
    fetchApi("/social-accounts", { token }),

  // Get account details
  getAccountDetails: (
    token: string,
    accountId: string
  ): Promise<InstagramAccount> =>
    fetchApi(`/social-accounts/${accountId}`, { token }),

  // Update account settings
  updateSettings: (
    token: string,
    accountId: string,
    settings: UpdateSettingsData
  ): Promise<InstagramAccount> =>
    fetchApi(`/social-accounts/${accountId}/settings`, {
      method: "PUT",
      token,
      body: JSON.stringify(settings),
    }),

  // Delete account
  deleteAccount: (token: string, accountId: string): Promise<void> =>
    fetchApi(`/social-accounts/${accountId}`, {
      method: "DELETE",
      token,
    }),

  // Get account statistics
  getAccountStats: (
    token: string,
    accountId: string
  ): Promise<InstagramAccount["stats"]> =>
    fetchApi(`/social-accounts/${accountId}/stats`, { token }),
};
