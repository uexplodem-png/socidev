import axios, { AxiosInstance, AxiosError } from 'axios';
import { secureStore } from '../storage/SecureStore';

const API_BASE_URL = 'http://localhost:3000/api'; // TODO: Use production URL

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  balance: number;
  status: string;
}

interface Task {
  id: string;
  userId: string;
  type: string;
  status: string;
  targetUrl: string;
  targetUsername?: string;
  quantity: number;
  completed: number;
  reward: number;
  expiresAt: string;
  createdAt: string;
}

interface TaskResult {
  taskId: string;
  success: boolean;
  completedCount: number;
  failedCount: number;
  error?: string;
  screenshots?: string[];
  logs?: string[];
}

class SociDevClient {
  private client: AxiosInstance;
  private authenticated: boolean = false;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load credentials from storage
    this.loadCredentials();

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        console.error('API Response Error:', error.response?.status, error.message);

        if (error.response?.status === 401) {
          // Unauthorized - clear credentials
          this.clearCredentials();
        }

        return Promise.reject(error);
      }
    );
  }

  private loadCredentials(): void {
    const credentials = secureStore.getApiCredentials();
    if (credentials) {
      this.setCredentials(credentials.apiKey, credentials.apiSecret);
    }
  }

  private setCredentials(apiKey: string, apiSecret: string): void {
    this.client.defaults.headers.common['X-API-Key'] = apiKey;
    this.client.defaults.headers.common['X-API-Secret'] = apiSecret;
    this.authenticated = true;
  }

  private clearCredentials(): void {
    delete this.client.defaults.headers.common['X-API-Key'];
    delete this.client.defaults.headers.common['X-API-Secret'];
    this.authenticated = false;
    secureStore.clearApiCredentials();
  }

  // Authenticate with API key and secret
  async authenticate(apiKey: string, apiSecret: string): Promise<ApiResponse<UserInfo>> {
    try {
      // Use desktop authentication endpoint
      const response = await axios.post(`${API_BASE_URL}/desktop/authenticate`, {
        apiKey,
        apiSecret,
      });

      if (response.data.success && response.data.data) {
        // Set credentials for future requests
        this.setCredentials(apiKey, apiSecret);

        // Save credentials to secure storage
        secureStore.saveApiCredentials(apiKey, apiSecret);

        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Invalid API credentials',
        };
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Authentication failed',
      };
    }
  }

  // Get authenticated user info
  async getUserInfo(): Promise<ApiResponse<UserInfo>> {
    try {
      const response = await this.client.get('/desktop/me');
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user info',
      };
    }
  }

  // Get available tasks for the user
  async getTasks(filters?: {
    type?: string;
    status?: string;
    limit?: number;
  }): Promise<ApiResponse<Task[]>> {
    try {
      const response = await this.client.get('/desktop/tasks', {
        params: filters,
      });
      return {
        success: true,
        data: response.data.data || response.data.tasks || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
      };
    }
  }

  // Get specific task details
  async getTask(taskId: string): Promise<ApiResponse<Task>> {
    try {
      const response = await this.client.get(`/desktop/tasks/${taskId}`);
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch task',
      };
    }
  }

  // Report task execution start
  async startTask(taskId: string): Promise<ApiResponse> {
    try {
      const response = await this.client.post(`/desktop/tasks/${taskId}/start`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start task',
      };
    }
  }

  // Report task execution result
  async reportTaskResult(taskId: string, result: TaskResult): Promise<ApiResponse> {
    try {
      const response = await this.client.post(`/desktop/tasks/${taskId}/result`, result);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to report task result',
      };
    }
  }

  // Update task progress
  async updateTaskProgress(
    taskId: string,
    progress: { completed: number; total: number }
  ): Promise<ApiResponse> {
    try {
      const response = await this.client.patch(`/desktop/tasks/${taskId}/progress`, progress);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update task progress',
      };
    }
  }

  // Check API rate limit status
  async getRateLimitStatus(): Promise<
    ApiResponse<{
      limit: number;
      remaining: number;
      reset: string;
    }>
  > {
    try {
      const response = await this.client.get('/user/api-key');
      const apiKey = response.data.data || response.data;

      return {
        success: true,
        data: {
          limit: apiKey.rateLimit || 1000,
          remaining: apiKey.rateLimit - apiKey.totalRequests || 0,
          reset: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get rate limit status',
      };
    }
  }

  // Logout (clear credentials)
  logout(): void {
    this.clearCredentials();
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return this.authenticated;
  }
}

// Singleton instance
export const sociDevClient = new SociDevClient();
export default SociDevClient;
