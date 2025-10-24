import { fetchApi } from "../api";

export interface Task {
  id: string;
  userId: string;
  type: "like" | "follow" | "view" | "subscribe";
  platform: "instagram" | "youtube";
  targetUrl: string;
  quantity: number;
  remainingQuantity: number;
  status: "available" | "completed" | "cooldown";
  lastExecutedAt?: string;
  cooldownEndsAt?: string;
  rate: number;
  lastUpdatedAt: string;
}

export interface TaskFilters {
  platform?: string;
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const taskApi = {
  getAvailableTasks: async (
    token: string,
    filters?: TaskFilters
  ): Promise<Task[]> => {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }

    return fetchApi(`/tasks/available?${queryParams.toString()}`, { token });
  },

  startTask: async (token: string, taskId: string): Promise<void> => {
    return fetchApi(`/tasks/${taskId}/start`, {
      method: "POST",
      token,
    });
  },

  completeTask: async (
    token: string,
    taskId: string,
    proof: Record<string, any>
  ): Promise<void> => {
    return fetchApi(`/tasks/${taskId}/complete`, {
      method: "POST",
      token,
      body: JSON.stringify({ proof }),
    });
  },

  getTaskDetails: async (token: string, taskId: string): Promise<Task> => {
    return fetchApi(`/tasks/${taskId}`, { token });
  },
};
