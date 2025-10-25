import { fetchApi } from "../api";

export interface Task {
  id: string;
  userId: string | null;
  orderId?: string;
  type: "like" | "follow" | "view" | "subscribe" | "comment" | "share";
  platform: "instagram" | "youtube" | "twitter" | "tiktok";
  targetUrl: string;
  quantity: number;
  remainingQuantity: number;
  status: "pending" | "in_progress" | "processing" | "submitted_for_approval" | "completed" | "failed" | "cancelled" | "rejected_by_admin";
  adminStatus: "pending" | "approved" | "rejected";
  screenshotUrl?: string;
  screenshotStatus?: "pending" | "approved" | "rejected";
  screenshotSubmittedAt?: string;
  startedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  payoutProcessed?: boolean;
  lastExecutedAt?: string;
  cooldownEndsAt?: string;
  rate: number;
  lastUpdatedAt: string;
  createdAt?: string;
  title?: string;
  description?: string;
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

  getTasksByStatus: async (
    token: string,
    status: string,
    filters?: TaskFilters
  ): Promise<Task[]> => {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }

    return fetchApi(`/tasks/status/${status}?${queryParams.toString()}`, { token });
  },

  startTask: async (token: string, taskId: string): Promise<Task> => {
    return fetchApi(`/tasks/${taskId}/start`, {
      method: "POST",
      token,
    });
  },

  submitScreenshot: async (
    token: string,
    taskId: string,
    file: File,
    comment?: string
  ): Promise<{ success: boolean; screenshotStatus: string; screenshotUrl: string; task: Task }> => {
    const formData = new FormData();
    formData.append('screenshot', file);
    if (comment) {
      formData.append('comment', comment);
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tasks/${taskId}/submit-screenshot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit screenshot');
    }

    return response.json();
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
