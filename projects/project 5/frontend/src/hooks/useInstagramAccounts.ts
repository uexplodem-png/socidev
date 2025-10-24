import { useState, useEffect, useCallback } from "react";
import { instagramApi, InstagramAccount } from "../lib/api/instagram";
import { toast } from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext";

export interface InstagramAccountDetails extends InstagramAccount {
  analytics?: {
    engagement: {
      rate: number;
      change: string;
      trend: "up" | "down";
    };
    growth: {
      followers: {
        value: number;
        percentage: string;
      };
      engagement: {
        value: number;
        percentage: string;
      };
    };
    performance: {
      successRate: number;
      averageTime: number;
      reliability: number;
    };
  };
  taskStats?: {
    likes: {
      completed: number;
      earnings: number;
      rate: {
        amount: number;
        unit: string;
      };
      success: number;
    };
    followers: {
      completed: number;
      earnings: number;
      rate: {
        amount: number;
        unit: string;
      };
      success: number;
    };
    views: {
      completed: number;
      earnings: number;
      rate: {
        amount: number;
        unit: string;
      };
      success: number;
    };
    comments: {
      completed: number;
      earnings: number;
      rate: {
        amount: number;
        unit: string;
      };
      success: number;
    };
  };
  completedTasks?: Array<{
    id: string;
    type: "likes" | "followers" | "views" | "comments";
    targetUrl: string;
    quantity: number;
    completedAt: string;
    success: number;
    earnings: number;
  }>;
}

export const useInstagramAccounts = () => {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] =
    useState<InstagramAccountDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const fetchedAccounts = await instagramApi.getAccounts(token);
      setAccounts(fetchedAccounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch accounts");
      console.error("Error fetching Instagram accounts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAccountDetails = useCallback(async (accountId: string) => {
    try {
      setLoadingDetails(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const accountDetails = await instagramApi.getAccountDetails(
        token,
        accountId
      );
      setSelectedAccount(accountDetails as InstagramAccountDetails);
      return accountDetails;
    } catch (err) {
      console.error("Error fetching account details:", err);
      throw err;
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const addAccount = useCallback(
    async (username: string, password: string) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Not authenticated");
        }

        const newAccount = await instagramApi.addAccount(token, {
          username,
          password,
        });
        setAccounts((prev) => [...prev, newAccount]);
        toast.success(t("accountAddedSuccessfully"));
        return newAccount;
      } catch (err) {
        const error = err as any;
        if (error.response?.data?.errors) {
          const validationErrors = error.response.data.errors;
          validationErrors.forEach((err: any) => {
            toast.error(t(err.message));
          });
        } else {
          toast.error(t("failedToAddAccount"));
        }
        throw err;
      }
    },
    [t]
  );

  const updateSettings = useCallback(
    async (accountId: string, settings: InstagramAccount["settings"]) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Not authenticated");
        }

        const updatedAccount = await instagramApi.updateSettings(
          token,
          accountId,
          settings
        );
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === accountId ? { ...acc, ...updatedAccount } : acc
          )
        );

        if (selectedAccount?.id === accountId) {
          setSelectedAccount((prev) =>
            prev ? { ...prev, ...updatedAccount } : null
          );
        }

        toast.success(t("settingsUpdatedSuccessfully"));
        return updatedAccount;
      } catch (err) {
        toast.error(t("failedToUpdateSettings"));
        throw err;
      }
    },
    [t, selectedAccount]
  );

  const deleteAccount = useCallback(
    async (accountId: string) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Not authenticated");
        }

        await instagramApi.deleteAccount(token, accountId);
        setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));

        if (selectedAccount?.id === accountId) {
          setSelectedAccount(null);
        }

        toast.success(t("accountDeletedSuccessfully"));
      } catch (err) {
        toast.error(t("failedToDeleteAccount"));
        throw err;
      }
    },
    [t, selectedAccount]
  );

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    selectedAccount,
    loadingDetails,
    fetchAccounts,
    fetchAccountDetails,
    addAccount,
    updateSettings,
    deleteAccount,
  };
};
