import { fetchApi } from "../api";

export interface DepositRequest {
  amount: number;
  method: "bank_transfer" | "credit_card" | "crypto";
  details: Record<string, any>;
}

export interface WithdrawRequest {
  amount: number;
  method: "bank_transfer" | "crypto";
  details: Record<string, any>;
}

export const balanceApi = {
  getBalance: (token: string) => fetchApi("/balance", { token }),

  deposit: (token: string, data: DepositRequest) =>
    fetchApi("/balance/deposit", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    }),

  withdraw: (token: string, data: WithdrawRequest) =>
    fetchApi("/balance/withdraw", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    }),

  getTransactions: (
    token: string,
    params?: {
      type?: string;
      status?: string;
      page?: number;
      limit?: number;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append("type", params.type);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    return fetchApi(`/balance/transactions?${queryParams.toString()}`, {
      token,
    });
  },
};
