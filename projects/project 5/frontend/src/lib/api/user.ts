import { fetchApi } from "../api";

export interface ProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface PasswordUpdate {
  currentPassword: string;
  newPassword: string;
}

export interface UserSettings {
  notifications?: {
    email: boolean;
    browser: boolean;
  };
  privacy?: {
    hideProfile: boolean;
    hideStats: boolean;
  };
  language?: "en" | "tr";
}

export interface DashboardStats {
  userMode: "taskDoer" | "taskGiver";
  balance: number;
  activeDevices?: {
    value: number;
    growth: number;
  };
  activeOrders?: {
    value: number;
    growth: number;
  };
  completedTasks?: {
    value: number;
    total: number;
    growth: number;
  };
  completedOrders?: {
    value: number;
    growth: number;
  };
  totalOrders?: {
    value: number;
    growth: number;
  };
  totalEarned?: {
    value: number;
    growth: number;
  };
  totalSpent?: {
    value: number;
    growth: number;
  };
  inProgressTasks?: {
    value: number;
  };
  platformStats: Array<{
    platform: string;
    completedTasks?: number;
    earnings?: number;
    activeOrders?: number;
    completedOrders?: number;
    totalSpent?: number;
  }>;
}

export const userApi = {
  getProfile: (token: string) => fetchApi("/user/profile", { token }),

  updateProfile: (token: string, data: ProfileUpdate) =>
    fetchApi("/user/profile", {
      method: "PUT",
      token,
      body: JSON.stringify(data),
    }),

  updatePassword: (token: string, data: PasswordUpdate) =>
    fetchApi("/user/password", {
      method: "PUT",
      token,
      body: JSON.stringify(data),
    }),

  updateUserMode: (token: string, userMode: "taskDoer" | "taskGiver") =>
    fetchApi("/user/mode", {
      method: "PUT",
      token,
      body: JSON.stringify({ userMode }),
    }),

  getSettings: (token: string) => fetchApi("/user/settings", { token }),

  updateSettings: (token: string, settings: UserSettings) =>
    fetchApi("/user/settings", {
      method: "PUT",
      token,
      body: JSON.stringify(settings),
    }),

  getDashboardStats: (token: string, timeframe: string = "30d") =>
    fetchApi(`/user/dashboard-stats?timeframe=${timeframe}`, { token }),
};
