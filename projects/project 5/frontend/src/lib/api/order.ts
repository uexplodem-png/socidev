import { fetchApi } from "../api";

export interface OrderCreation {
  platform: "instagram" | "youtube";
  service: string;
  targetUrl: string;
  quantity: number;
  speed?: "normal" | "fast" | "express";
}

export interface BulkOrderCreation {
  orders: OrderCreation[];
}

export interface OrderFilters {
  status?: string;
  platform?: string;
  service?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface OrderStats {
  activeOrders: { value: number; growth: number };
  completedOrders: { value: number; growth: number };
  totalOrders: { value: number; growth: number };
  totalSpent: { value: number; growth: number };
}

export interface OrdersResponse {
  orders: Array<{
    id: string;
    platform: "instagram" | "youtube";
    service: string;
    targetUrl: string;
    quantity: number;
    startCount: number;
    remainingCount: number;
    status: "completed" | "processing" | "pending" | "failed";
    createdAt: string;
    amount: number;
    speed: "normal" | "fast" | "express";
  }>;
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export const orderApi = {
  getOrderStats: (
    token: string,
    platform?: string,
    timeframe: string = "30d"
  ) => {
    const queryParams = new URLSearchParams();
    if (platform) queryParams.append("platform", platform);
    queryParams.append("timeframe", timeframe);

    return fetchApi<OrderStats>(`/orders/stats?${queryParams.toString()}`, {
      token,
    });
  },

  getOrders: (token: string, filters?: OrderFilters) => {
    const queryParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }

    return fetchApi<OrdersResponse>(`/orders?${queryParams.toString()}`, {
      token,
    });
  },

  getOrderDetails: (token: string, orderId: string) =>
    fetchApi<OrdersResponse["orders"][0]>(`/orders/${orderId}`, { token }),

  createOrder: (token: string, data: OrderCreation) =>
    fetchApi<{ id: string }>("/orders", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    }),

  createBulkOrders: (token: string, data: BulkOrderCreation) =>
    fetchApi<{ ids: string[] }>("/orders/bulk", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    }),

  reportIssue: (
    token: string,
    orderId: string,
    data: { type: string; description: string }
  ) =>
    fetchApi(`/orders/${orderId}/report`, {
      method: "POST",
      token,
      body: JSON.stringify(data),
    }),

  repeatOrder: (token: string, orderId: string) =>
    fetchApi(`/orders/${orderId}/repeat`, {
      method: "POST",
      token,
    }),
};
