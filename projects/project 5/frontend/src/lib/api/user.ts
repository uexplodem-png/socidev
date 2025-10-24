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
};
