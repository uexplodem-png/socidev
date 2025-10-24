import { fetchApi } from "../api";

export interface SocialAccountCredentials {
  platform: "instagram" | "youtube";
  email: string;
  password: string;
}

export interface AccountSettings {
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

export const socialApi = {
  // Instagram Accounts
  getInstagramAccounts: (token: string) =>
    fetchApi("/social-accounts?platform=instagram", { token }),

  getInstagramAccountDetails: (token: string, accountId: string) =>
    fetchApi(`/social-accounts/${accountId}`, { token }),

  // YouTube Accounts
  getYoutubeAccounts: (token: string) =>
    fetchApi("/social-accounts?platform=youtube", { token }),

  getYoutubeAccountDetails: (token: string, accountId: string) =>
    fetchApi(`/social-accounts/${accountId}`, { token }),

  // Common Operations
  addAccount: (token: string, credentials: SocialAccountCredentials) =>
    fetchApi("/social-accounts", {
      method: "POST",
      token,
      body: JSON.stringify(credentials),
    }),

  updateAccountSettings: (
    token: string,
    accountId: string,
    settings: AccountSettings
  ) =>
    fetchApi(`/social-accounts/${accountId}/settings`, {
      method: "PUT",
      token,
      body: JSON.stringify(settings),
    }),

  deleteAccount: (token: string, accountId: string) =>
    fetchApi(`/social-accounts/${accountId}`, {
      method: "DELETE",
      token,
    }),

  getAccountStats: (token: string, accountId: string) =>
    fetchApi(`/social-accounts/${accountId}/stats`, { token }),
};
