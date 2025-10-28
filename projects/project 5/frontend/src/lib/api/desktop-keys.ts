import { fetchApi } from "../api";

export interface DesktopApiKey {
    id: string;
    name: string;
    permissions: {
        getTasks: boolean;
        getTaskDetails: boolean;
        getInProgressTasks: boolean;
        completeTask: boolean;
        uploadScreenshot: boolean;
    };
    rateLimit: number;
    ipWhitelist: string[];
    status: 'active' | 'suspended' | 'revoked';
    lastUsedAt: string | null;
    lastUsedIp: string | null;
    requestCount: number;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateApiKeyRequest {
    name: string;
    permissions?: {
        getTasks?: boolean;
        getTaskDetails?: boolean;
        getInProgressTasks?: boolean;
        completeTask?: boolean;
        uploadScreenshot?: boolean;
    };
    rateLimit?: number;
    ipWhitelist?: string[];
    expiresAt?: string | null;
}

export interface CreateApiKeyResponse {
    id: string;
    name: string;
    apiKey: string; // Only shown once!
    apiSecret: string; // Only shown once!
    permissions: DesktopApiKey['permissions'];
    rateLimit: number;
    ipWhitelist: string[];
    status: string;
    createdAt: string;
}

export const desktopApiKeyApi = {
    // Create new API key
    createApiKey: (token: string, data: CreateApiKeyRequest) =>
        fetchApi("/desktop-keys", {
            method: "POST",
            token,
            body: JSON.stringify(data),
        }),

    // Get all API keys
    getApiKeys: (token: string) =>
        fetchApi("/desktop-keys", { token }),

    // Get specific API key stats
    getApiKeyStats: (token: string, keyId: string) =>
        fetchApi(`/desktop-keys/${keyId}`, { token }),

    // Update API key
    updateApiKey: (token: string, keyId: string, data: Partial<CreateApiKeyRequest>) =>
        fetchApi(`/desktop-keys/${keyId}`, {
            method: "PUT",
            token,
            body: JSON.stringify(data),
        }),

    // Revoke API key
    revokeApiKey: (token: string, keyId: string) =>
        fetchApi(`/desktop-keys/${keyId}/revoke`, {
            method: "POST",
            token,
        }),

    // Delete API key
    deleteApiKey: (token: string, keyId: string) =>
        fetchApi(`/desktop-keys/${keyId}`, {
            method: "DELETE",
            token,
        }),
};
