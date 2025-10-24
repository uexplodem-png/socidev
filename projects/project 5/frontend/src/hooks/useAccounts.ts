import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountsApi, Account } from "../lib/api/accounts";
import { toast } from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext";

interface UseAccountsOptions {
  platform?: "instagram" | "youtube";
  enabled?: boolean;
}

export const useAccounts = (options: UseAccountsOptions = {}) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Fetch accounts
  const {
    data: accounts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["accounts", options.platform],
    queryFn: () => accountsApi.getAccounts(options.platform),
    enabled: options.enabled !== false,
  });

  // Add account
  const addAccountMutation = useMutation({
    mutationFn: accountsApi.addAccount,
    onSuccess: (newAccount: Account) => {
      queryClient.setQueryData<Account[]>(
        ["accounts", options.platform],
        (old = []) => [...old, newAccount]
      );
      toast.success(t("accountAddedSuccessfully"));
    },
    onError: () => {
      toast.error(t("failedToAddAccount"));
    },
  });

  // Update account
  const updateAccountMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & Parameters<typeof accountsApi.updateAccount>[1]) =>
      accountsApi.updateAccount(id, data),
    onSuccess: (updatedAccount: Account) => {
      queryClient.setQueryData<Account[]>(
        ["accounts", options.platform],
        (old = []) =>
          old.map((acc) =>
            acc.id === updatedAccount.id ? updatedAccount : acc
          )
      );
      toast.success(t("accountUpdatedSuccessfully"));
    },
    onError: () => {
      toast.error(t("failedToUpdateAccount"));
    },
  });

  // Delete account
  const deleteAccountMutation = useMutation({
    mutationFn: accountsApi.deleteAccount,
    onSuccess: (_: void, accountId: string) => {
      queryClient.setQueryData<Account[]>(
        ["accounts", options.platform],
        (old = []) => old.filter((acc) => acc.id !== accountId)
      );
      toast.success(t("accountDeletedSuccessfully"));
    },
    onError: () => {
      toast.error(t("failedToDeleteAccount"));
    },
  });

  return {
    accounts,
    loading: isLoading,
    error,
    refetch,
    addAccount: addAccountMutation.mutateAsync,
    updateAccount: updateAccountMutation.mutateAsync,
    deleteAccount: deleteAccountMutation.mutateAsync,
    isAdding: addAccountMutation.isPending,
    isUpdating: updateAccountMutation.isPending,
    isDeleting: deleteAccountMutation.isPending,
  };
};
