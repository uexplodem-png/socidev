import { fetchApi } from "../api";

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  phone?: string;
  userType: 'task_doer' | 'task_giver';
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  phone?: string;
  balance: number; // Ensure this is explicitly typed as number
  createdAt?: string;
  // Backend-provided mode/role (snake_case). We'll map it in AuthContext.
  userMode?: 'task_doer' | 'task_giver';
  role?: 'task_doer' | 'task_giver' | string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: AuthUser;
  };
}

export interface ValidateTokenResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
  };
}

export const authApi = {
  login: (credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> =>
    fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  register: (data: RegisterData): Promise<AuthResponse> =>
    fetchApi("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  validateToken: (token: string): Promise<ValidateTokenResponse> => {
    if (!token) {
      return Promise.reject(new Error("No token provided for validation"));
    }

    // Check if token looks like a valid JWT (has 3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return Promise.reject(new Error("Invalid token format"));
    }

    return fetchApi("/auth/validate", {
      token: token,
    });
  },
};