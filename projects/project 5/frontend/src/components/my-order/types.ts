export interface Order {
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
}

export interface StatValue {
  value: number;
  growth: number;
}

export interface OrderStats {
  activeOrders: StatValue;
  completedOrders: StatValue;
  totalOrders: StatValue;
  totalSpent: StatValue;
}
