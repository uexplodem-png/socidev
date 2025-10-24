import axios, { AxiosRequestConfig } from "axios";
import { z } from "zod";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Validation schemas
const AccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  platform: z.enum(["instagram", "youtube"]),
  username: z.string(),
  status: z.enum(["active", "inactive", "limited"]),
  lastChecked: z.string().datetime(),
  stats: z.object({
    followers: z.number(),
    totalEarnings: z.number(),
    completedTasks: z.number(),
    engagement: z.number(),
  }),
  earnings: z.object({
    total: z.number(),
    thisMonth: z.number(),
    lastMonth: z.number(),
  }),
});

export type Account = z.infer<typeof AccountSchema>;

const api = axios.create({
  baseURL: `${API_URL}/accounts`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config: AxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const accountsApi = {
  // Get all accounts
  getAccounts: async (
    platform?: "instagram" | "youtube"
  ): Promise<Account[]> => {
    const { data } = await api.get(platform ? `?platform=${platform}` : "");
    return z.array(AccountSchema).parse(data);
  },

  // Get single account
  getAccount: async (id: string): Promise<Account> => {
    const { data } = await api.get(`/${id}`);
    return AccountSchema.parse(data);
  },

  // Add new account
  addAccount: async (accountData: {
    platform: "instagram" | "youtube";
    username: string;
    password: string;
  }): Promise<Account> => {
    const { data } = await api.post("", accountData);
    return AccountSchema.parse(data);
  },

  // Update account
  updateAccount: async (
    id: string,
    updateData: {
      username?: string;
      password?: string;
      settings?: {
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
      };
    }
  ): Promise<Account> => {
    const { data } = await api.put(`/${id}`, updateData);
    return AccountSchema.parse(data);
  },

  // Delete account
  deleteAccount: async (id: string): Promise<void> => {
    await api.delete(`/${id}`);
  },

  // Get account statistics
  getAccountStats: async (id: string): Promise<Account["stats"]> => {
    const { data } = await api.get(`/${id}/stats`);
    return AccountSchema.shape.stats.parse(data);
  },
};
