import {
    User,
    LoginCredentials,
    FilterParams,
    PaginatedResponse,
    Order,
    Transaction,
    PlatformConfig,
    ServiceConfig
} from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        user: User;
    };
}

interface ValidateTokenResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
    };
}

interface UsersResponse {
    users: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface UserDetailResponse {
    user: User;
    statistics: {
        totalOrders: number;
        totalSpent: number;
        totalEarned: number;
        completedTasks: number;
    };
}

interface UserTransactionsResponse {
    transactions: Transaction[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface OrdersResponse {
    orders: Order[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface OrderDetailResponse {
    order: Order;
}

class RealApiService {
    private convertUserFields(user: any): User {
        return {
            id: user.id,
            firstName: user.first_name || user.firstName,
            lastName: user.last_name || user.lastName,
            email: user.email,
            username: user.username,
            role: user.role,
            status: user.status,
            balance: typeof user.balance === 'string' ? parseFloat(user.balance) : user.balance,
            createdAt: user.created_at || user.createdAt,
            updatedAt: user.updated_at || user.updatedAt,
            lastLogin: user.last_login || user.lastLogin,
            permissions: user.permissions || [],
            avatar: user.avatar,
        };
    }

    private getToken(): string | null {
        return localStorage.getItem('token');
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        const headers = new Headers({
            'Content-Type': 'application/json',
            ...options.headers,
        });

        // Add auth token if available
        const token = this.getToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // If we can't parse the error response, use the default message
            }
            throw new Error(errorMessage);
        }

        return response.json();
    }

    // Auth API
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        return this.request<AuthResponse>('/auth/admin-login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    async validateToken(): Promise<ValidateTokenResponse> {
        return this.request<ValidateTokenResponse>('/auth/validate', {
            method: 'GET',
        });
    }

    async logout(): Promise<{ success: boolean }> {
        localStorage.removeItem('token');
        return { success: true };
    }

    // Users API
    async getUsers(params: FilterParams): Promise<PaginatedResponse<User>> {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });

        const response = await this.request<UsersResponse>(`/admin/users?${queryParams}`);

        // Convert snake_case to camelCase for user fields
        const convertedUsers = response.users.map((user: any) => ({
            id: user.id,
            firstName: user.first_name || user.firstName,
            lastName: user.last_name || user.lastName,
            email: user.email,
            username: user.username,
            phone: user.phone,
            role: user.role,
            status: user.status,
            balance: typeof user.balance === 'string' ? parseFloat(user.balance) : user.balance,
            emailVerified: user.email_verified || user.emailVerified,
            createdAt: user.created_at || user.createdAt,
            updatedAt: user.updated_at || user.updatedAt,
            lastLogin: user.last_login || user.lastLogin,
            permissions: user.permissions || [],
        }));

        return {
            data: convertedUsers,
            pagination: response.pagination
        };
    }

    async getUserById(id: string): Promise<UserDetailResponse> {
        const response = await this.request<any>(`/admin/users/${id}`);

        // Handle both response structures
        let userWithDetails = response.user || response;
        let sections = response.sections;

        if (!userWithDetails || typeof userWithDetails !== 'object') {
            console.error('No user data in response:', response);
            throw new Error('No user data received from server');
        }

        // Convert main user object from snake_case to camelCase
        userWithDetails = {
            ...userWithDetails,
            id: userWithDetails.id,
            firstName: userWithDetails.first_name || userWithDetails.firstName,
            lastName: userWithDetails.last_name || userWithDetails.lastName,
            email: userWithDetails.email,
            username: userWithDetails.username,
            phone: userWithDetails.phone,
            role: userWithDetails.role,
            status: userWithDetails.status,
            balance: typeof userWithDetails.balance === 'string' ? parseFloat(userWithDetails.balance) : userWithDetails.balance,
            emailVerified: userWithDetails.email_verified || userWithDetails.emailVerified,
            createdAt: userWithDetails.created_at || userWithDetails.createdAt,
            updatedAt: userWithDetails.updated_at || userWithDetails.updatedAt,
            lastLogin: userWithDetails.last_login || userWithDetails.lastLogin,
            permissions: userWithDetails.permissions || [],
        };

        // Helper function to convert snake_case to camelCase
        const convertToCamelCase = (obj: any) => {
            if (!obj) return obj;
            const converted: any = {};
            const keyMappings: { [key: string]: string } = {
                'user_id': 'userId',
                'user_name': 'userName',
                'user_email': 'userEmail',
                'target_url': 'targetUrl',
                'created_at': 'createdAt',
                'updated_at': 'updatedAt',
                'start_count': 'startCount',
                'remaining_count': 'remainingCount',
                'completed_count': 'completedCount',
                'started_at': 'startedAt',
                'completed_at': 'completedAt',
                'device_name': 'deviceName',
                'device_type': 'deviceType',
                'ip_address': 'ipAddress',
                'last_active': 'lastActive',
                'last_login': 'lastLogin',
                'tasks_completed': 'tasksCompleted',
                'device_fingerprint': 'deviceFingerprint',
                'user_agent': 'userAgent',
                'screen_resolution': 'screenResolution',
                'account_id': 'accountId',
                'profile_url': 'profileUrl',
                'followers_count': 'followers',
                'following_count': 'followingCount',
                'posts_count': 'postsCount',
                'last_activity': 'lastActivity',
                'health_score': 'healthScore',
                'verification_status': 'verificationStatus',
                'access_token': 'accessToken',
                'refresh_token': 'refreshToken',
                'token_expires_at': 'tokenExpiresAt',
                'account_data': 'accountData',
                'error_count': 'errorCount',
                'last_error': 'lastError',
                'last_error_at': 'lastErrorAt',
                'order_id': 'orderId',
            };

            for (const [key, value] of Object.entries(obj)) {
                // Use mapped key if it exists, otherwise keep original key
                const mappedKey = keyMappings[key] || key;
                converted[mappedKey] = value;
            }
            return converted;
        };

        // Process sections if they exist
        if (sections) {
            // Process Orders
            if (sections.orders && sections.orders.data) {
                userWithDetails.orders = sections.orders.data.map((item: any) => {
                    const converted = convertToCamelCase(item);
                    if (converted.amount) converted.amount = typeof converted.amount === 'string' ? parseFloat(converted.amount) : converted.amount;
                    return converted;
                });
            }

            // Process Balance History
            if (sections.balanceHistory && sections.balanceHistory.data) {
                userWithDetails.transactions = sections.balanceHistory.data.map((item: any) => {
                    const converted = convertToCamelCase(item);
                    if (converted.amount) converted.amount = typeof converted.amount === 'string' ? parseFloat(converted.amount) : converted.amount;
                    return converted;
                });
            }

            // Process Withdrawals
            if (sections.withdrawals && sections.withdrawals.data) {
                userWithDetails.withdrawals = sections.withdrawals.data.map((item: any) => {
                    const converted = convertToCamelCase(item);
                    if (converted.amount) converted.amount = typeof converted.amount === 'string' ? parseFloat(converted.amount) : converted.amount;
                    return converted;
                });
            }

            // Process Social Media
            if (sections.socialMedia && sections.socialMedia.data) {
                userWithDetails.socialAccounts = sections.socialMedia.data.map((item: any) => convertToCamelCase(item));
            }

            // Process Devices
            if (sections.devices && sections.devices.data) {
                userWithDetails.devices = sections.devices.data.map((item: any) => convertToCamelCase(item));
            }

            // Process Tasks
            if (sections.tasks && sections.tasks.data) {
                userWithDetails.tasks = sections.tasks.data.map((item: any) => convertToCamelCase(item));
            }

            // Add analytics
            userWithDetails.analytics = sections.analytics;
        } else {
            // Fallback to old method if sections don't exist
            // Convert order property names from snake_case to camelCase
            if (userWithDetails && userWithDetails.orders) {
                userWithDetails.orders = userWithDetails.orders.map((order: any) => ({
                    ...order,
                    userId: order.user_id || order.userId,
                    userName: order.user_name || order.userName,
                    userEmail: order.user_email || order.userEmail,
                    targetUrl: order.target_url || order.targetUrl,
                    createdAt: order.created_at || order.createdAt,
                    updatedAt: order.updated_at || order.updatedAt,
                    startCount: order.start_count || order.startCount,
                    remainingCount: order.remaining_count || order.remainingCount,
                    completedCount: order.completed_count || order.completedCount,
                    startedAt: order.started_at || order.startedAt,
                    completedAt: order.completed_at || order.completedAt,
                    amount: typeof order.amount === 'string' ? parseFloat(order.amount) : (order.amount || 0),
                }));
            }

            // Convert transaction property names from snake_case to camelCase
            if (userWithDetails && userWithDetails.transactions) {
                userWithDetails.transactions = userWithDetails.transactions.map((transaction: any) => ({
                    ...transaction,
                    userId: transaction.user_id || transaction.userId,
                    userName: transaction.user_name || transaction.userName,
                    createdAt: transaction.created_at || transaction.createdAt,
                    updatedAt: transaction.updated_at || transaction.updatedAt,
                    amount: typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount,
                }));
            }

            // Convert task property names from snake_case to camelCase
            if (userWithDetails && userWithDetails.tasks) {
                userWithDetails.tasks = userWithDetails.tasks.map((task: any) => ({
                    ...task,
                    userId: task.user_id || task.userId,
                    createdAt: task.created_at || task.createdAt,
                    updatedAt: task.updated_at || task.updatedAt,
                }));
            }

            // Convert withdrawal property names from snake_case to camelCase
            if (userWithDetails && userWithDetails.withdrawals) {
                userWithDetails.withdrawals = userWithDetails.withdrawals.map((withdrawal: any) => ({
                    ...withdrawal,
                    userId: withdrawal.user_id || withdrawal.userId,
                    userName: withdrawal.user_name || withdrawal.userName,
                    createdAt: withdrawal.created_at || withdrawal.createdAt,
                    updatedAt: withdrawal.updated_at || withdrawal.updatedAt,
                    amount: typeof withdrawal.amount === 'string' ? parseFloat(withdrawal.amount) : (withdrawal.amount || 0),
                    orderId: withdrawal.order_id || withdrawal.orderId,
                    description: withdrawal.description || withdrawal.description,
                }));
            }

            // Convert device property names from snake_case to camelCase
            if (userWithDetails && userWithDetails.devices) {
                userWithDetails.devices = userWithDetails.devices.map((device: any) => ({
                    ...device,
                    userId: device.user_id || device.userId,
                    deviceName: device.device_name || device.deviceName,
                    deviceType: device.device_type || device.deviceType,
                    ipAddress: device.ip_address || device.ipAddress,
                    createdAt: device.created_at || device.createdAt,
                    updatedAt: device.updated_at || device.updatedAt,
                    lastActive: device.last_active || device.lastActive,
                    tasksCompleted: device.tasks_completed || device.tasksCompleted,
                    deviceFingerprint: device.device_fingerprint || device.deviceFingerprint,
                    userAgent: device.user_agent || device.userAgent,
                    screenResolution: device.screen_resolution || device.screenResolution,
                }));
            }

            // Convert social account property names from snake_case to camelCase
            if (userWithDetails && userWithDetails.socialAccounts) {
                userWithDetails.socialAccounts = userWithDetails.socialAccounts.map((account: any) => ({
                    ...account,
                    userId: account.user_id || account.userId,
                    accountId: account.account_id || account.accountId,
                    profileUrl: account.profile_url || account.profileUrl,
                    createdAt: account.created_at || account.createdAt,
                    updatedAt: account.updated_at || account.updatedAt,
                    lastActivity: account.last_activity || account.lastActivity,
                    followers: account.followers_count || account.followers,
                    followingCount: account.following_count || account.followingCount,
                    postsCount: account.posts_count || account.postsCount,
                    healthScore: account.health_score || account.healthScore,
                    verificationStatus: account.verification_status || account.verificationStatus,
                    accessToken: account.access_token || account.accessToken,
                    refreshToken: account.refresh_token || account.refreshToken,
                    tokenExpiresAt: account.token_expires_at || account.tokenExpiresAt,
                    accountData: account.account_data || account.accountData,
                    errorCount: account.error_count || account.errorCount,
                    lastError: account.last_error || account.lastError,
                    lastErrorAt: account.last_error_at || account.lastErrorAt,
                }));
            }
        }

        // Return in the expected UserDetailResponse format
        return {
            user: userWithDetails,
            statistics: sections?.overview?.statistics || {
                totalOrders: 0,
                totalSpent: 0,
                totalEarned: 0,
                completedTasks: 0,
            }
        } as UserDetailResponse;
    }

    async createUser(userData: Partial<User>): Promise<User> {
        const response = await this.request<{ user: any }>('/admin/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        return this.convertUserFields(response.user);
    }

    async updateUser(id: string, updates: Partial<User>): Promise<User> {
        const response = await this.request<{ user: any }>(`/admin/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
        return this.convertUserFields(response.user);
    }

    async suspendUser(id: string, reason?: string): Promise<User> {
        const response = await this.request<{ user: any }>(`/admin/users/${id}/suspend`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
        return this.convertUserFields(response.user);
    }

    async activateUser(id: string): Promise<User> {
        const response = await this.request<{ user: any }>(`/admin/users/${id}/activate`, {
            method: 'POST',
        });
        return this.convertUserFields(response.user);
    }

    async adjustUserBalance(id: string, amount: number, type: 'add' | 'subtract', reason: string): Promise<{ user: User; transaction: Transaction }> {
        const response = await this.request<{ user: User; transaction: Transaction }>(`/admin/users/${id}/balance`, {
            method: 'POST',
            body: JSON.stringify({ amount, type, reason }),
        });

        // Convert amount string to number if needed
        if (typeof response.transaction.amount === 'string') {
            response.transaction.amount = parseFloat(response.transaction.amount);
        }

        return response;
    }

    async getUserTransactions(userId: string, params: FilterParams): Promise<PaginatedResponse<Transaction>> {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });

        const response = await this.request<UserTransactionsResponse>(`/admin/users/${userId}/transactions?${queryParams}`);

        // Convert amount strings to numbers
        const transactionsWithNumericAmounts = response.transactions.map(transaction => ({
            ...transaction,
            amount: typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount
        }));

        return {
            data: transactionsWithNumericAmounts,
            pagination: response.pagination
        };
    }

    async getUserOrders(userId: string, params: FilterParams = {}): Promise<PaginatedResponse<Order>> {
        const queryParams = new URLSearchParams();
        queryParams.append('userId', userId);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });

        const response = await this.request<OrdersResponse>(`/admin/orders?${queryParams}`);

        // Convert and flatten user fields
        const ordersWithMappedFields = response.orders.map((order: any) => {
            const user = order.user || {};
            const combinedName = [user.firstName, user.lastName].filter(Boolean).join(' ');
            const derivedName = user.username || combinedName || user.email || 'Unknown User';
            return {
                ...order,
                userId: order.userId || order.user_id || user.id,
                userName: order.userName || order.user_name || derivedName,
                userEmail: order.userEmail || order.user_email || user.email || '',
                amount: typeof order.amount === 'string' ? parseFloat(order.amount) : order.amount,
            };
        });

        return {
            data: ordersWithMappedFields,
            pagination: response.pagination
        };
    }

    // Orders API
    async getOrders(params: FilterParams): Promise<PaginatedResponse<Order>> {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });

        const response = await this.request<OrdersResponse>(`/admin/orders?${queryParams}`);

        // Convert amount and flatten user
        const ordersWithMappedFields = response.orders.map((order: any) => {
            const user = order.user || {};
            return {
                ...order,
                userId: order.userId || order.user_id || user.id,
                userName: order.userName || order.user_name || (user.username || [user.firstName, user.lastName].filter(Boolean).join(' ')),
                userEmail: order.userEmail || order.user_email || user.email,
                amount: typeof order.amount === 'string' ? parseFloat(order.amount) : order.amount,
            };
        });

        return {
            data: ordersWithMappedFields,
            pagination: response.pagination
        };
    }

    async getOrderById(id: string): Promise<Order> {
        const response = await this.request<OrderDetailResponse>(`/admin/orders/${id}`);

        const order: any = response.order || {};
        const user = order.user || {};

        // Flatten user fields and normalize amount
        order.userId = order.userId || order.user_id || user.id;
        const combinedName = [user.firstName, user.lastName].filter(Boolean).join(' ');
        const derivedName = user.username || combinedName || user.email || 'Unknown User';
        order.userName = order.userName || order.user_name || derivedName;
        order.userEmail = order.userEmail || order.user_email || user.email || '';

        if (typeof order.amount === 'string') {
            order.amount = parseFloat(order.amount);
        }

        return order as Order;
    }

    async updateOrderStatus(id: string, status: string, notes?: string): Promise<Order> {
        const response = await this.request<{ order: Order }>(`/admin/orders/${id}/status`, {
            method: 'POST',
            body: JSON.stringify({ status, notes }),
        });

        // Convert amount string to number if needed
        if (typeof response.order.amount === 'string') {
            response.order.amount = parseFloat(response.order.amount);
        }

        return response.order;
    }

    async updateOrder(id: string, data: Partial<Order>): Promise<Order> {
        const payload: any = { ...data };
        // Map camelCase to API expectations where needed
        if ((payload as any).targetUrl) {
            payload.target_url = (payload as any).targetUrl;
            delete (payload as any).targetUrl;
        }

        const response = await this.request<{ order: Order }>(`/admin/orders/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });

        // Normalize amount
        if (typeof response.order.amount === 'string') {
            response.order.amount = parseFloat(response.order.amount);
        }

        return response.order;
    }

    // Add the refundOrder method
    async refundOrder(id: string): Promise<Order> {
        const response = await this.request<{ order: Order }>(`/admin/orders/${id}/refund`, {
            method: 'POST',
        });

        // Convert amount string to number if needed
        if (typeof response.order.amount === 'string') {
            response.order.amount = parseFloat(response.order.amount);
        }

        return response.order;
    }

    // **PART 6: Process order (move to processing status, creates task)**
    async processOrder(id: string): Promise<Order> {
        const response = await this.request<{ order: Order }>(`/admin/orders/${id}/process`, {
            method: 'POST',
        });

        // Convert amount string to number if needed
        if (typeof response.order.amount === 'string') {
            response.order.amount = parseFloat(response.order.amount);
        }

        return response.order;
    }

    // **PART 6: Complete order (mark as completed)**
    async completeOrder(id: string): Promise<Order> {
        const response = await this.request<{ order: Order }>(`/admin/orders/${id}/complete`, {
            method: 'POST',
        });

        // Convert amount string to number if needed
        if (typeof response.order.amount === 'string') {
            response.order.amount = parseFloat(response.order.amount);
        }

        return response.order;
    }

    // Audit Logs methods
    async getAuditLogs(params: any = {}): Promise<{ auditLogs: any[]; pagination: any }> {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });

        return this.request<{ auditLogs: any[]; pagination: any }>(`/admin/audit-logs?${queryParams}`);
    }

    async getAuditLogStats(timeRange: string = '30d'): Promise<any> {
        return this.request(`/admin/audit-logs/stats?timeRange=${timeRange}`);
    }

    async exportAuditLogs(filters: any): Promise<Blob> {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) queryParams.append(key, String(value));
        });

        const response = await fetch(
            `${API_BASE_URL}/admin/audit-logs/export?${queryParams}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`,
                },
            }
        );

        if (!response.ok) throw new Error('Export failed');
        return response.blob();
    }

    // System Logs API (combined.log and error.log)
    async getCombinedLogs(params: { page?: number; limit?: number; search?: string }): Promise<any> {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });

        return this.request(`/admin/system-logs/combined?${queryParams}`);
    }

    async getErrorLogs(params: { page?: number; limit?: number; search?: string }): Promise<any> {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });

        return this.request(`/admin/system-logs/error?${queryParams}`);
    }

    async clearSystemLogs(type: 'combined' | 'error'): Promise<any> {
        return this.request(`/admin/system-logs/clear/${type}`, {
            method: 'DELETE',
        });
    }

    // Balance & Transactions API
    async getTransactions(params: FilterParams): Promise<PaginatedResponse<Transaction>> {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });

        const response = await this.request<UserTransactionsResponse>(`/admin/transactions?${queryParams}`);

        // Convert amount strings to numbers
        const transactionsWithNumericAmounts = response.transactions.map(transaction => ({
            ...transaction,
            amount: typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount
        }));

        return {
            data: transactionsWithNumericAmounts,
            pagination: response.pagination
        };
    }

    async createTransaction(data: any): Promise<{ transaction: Transaction }> {
        const response = await this.request<{ transaction: Transaction }>(`/admin/transactions`, {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (typeof response.transaction.amount === 'string') {
            response.transaction.amount = parseFloat(response.transaction.amount);
        }

        return response;
    }

    async getWithdrawals(params: FilterParams): Promise<PaginatedResponse<Transaction>> {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });

        const response = await this.request<UserTransactionsResponse>(`/admin/transactions?type=withdrawal&${queryParams}`);

        // Convert amount strings to numbers
        const transactionsWithNumericAmounts = response.transactions.map(transaction => ({
            ...transaction,
            amount: typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount
        }));

        return {
            data: transactionsWithNumericAmounts,
            pagination: response.pagination
        };
    }

    async approveWithdrawal(transactionId: string, notes?: string): Promise<Transaction> {
        const response = await this.request<{ transaction: Transaction }>(`/admin/transactions/${transactionId}/approve`, {
            method: 'POST',
            body: JSON.stringify({ notes }),
        });

        if (typeof response.transaction.amount === 'string') {
            response.transaction.amount = parseFloat(response.transaction.amount);
        }

        return response.transaction;
    }

    async rejectWithdrawal(transactionId: string, notes?: string): Promise<Transaction> {
        const response = await this.request<{ transaction: Transaction }>(`/admin/transactions/${transactionId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ notes }),
        });

        if (typeof response.transaction.amount === 'string') {
            response.transaction.amount = parseFloat(response.transaction.amount);
        }

        return response.transaction;
    }

    // Settings API
    async getSettings(): Promise<any> {
        return this.request<any>(`/admin/settings`, {
            method: 'GET',
        });
    }

    async updateSettings(data: any): Promise<any> {
        return this.request<any>(`/admin/settings`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async resetData(): Promise<any> {
        return this.request<any>(`/admin/settings/reset-data`, {
            method: 'POST',
        });
    }

    // Platforms API
    async getPlatforms(params: FilterParams = {}): Promise<PaginatedResponse<PlatformConfig>> {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });

        const response = await this.request<{ platforms: any[]; pagination: any }>(`/admin/platforms?${queryParams}`);
        return {
            data: response.platforms,
            pagination: response.pagination
        };
    }

    async getPlatformById(id: string): Promise<PlatformConfig> {
        const response = await this.request<any>(`/admin/platforms/${id}`);
        return response;
    }

    async createPlatform(data: Partial<PlatformConfig>): Promise<PlatformConfig> {
        const response = await this.request<{ success: boolean; platform: any }>('/admin/platforms', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.platform;
    }

    async updatePlatform(id: string, data: Partial<PlatformConfig>): Promise<PlatformConfig> {
        const response = await this.request<{ success: boolean; platform: any }>(`/admin/platforms/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response.platform;
    }

    async deletePlatform(id: string): Promise<{ success: boolean; message: string }> {
        return this.request<{ success: boolean; message: string }>(`/admin/platforms/${id}`, {
            method: 'DELETE',
        });
    }

    // Services API
    async getServices(params: FilterParams = {}): Promise<PaginatedResponse<ServiceConfig>> {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });

        const response = await this.request<{ services: any[]; pagination: any }>(`/admin/services?${queryParams}`);
        return {
            data: response.services,
            pagination: response.pagination
        };
    }

    async getServiceById(id: string): Promise<ServiceConfig> {
        const response = await this.request<any>(`/admin/services/${id}`);
        return response;
    }

    async createService(data: Partial<ServiceConfig>): Promise<ServiceConfig> {
        const response = await this.request<{ success: boolean; service: any }>('/admin/services', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.service;
    }

    async updateService(id: string, data: Partial<ServiceConfig>): Promise<ServiceConfig> {
        const response = await this.request<{ success: boolean; service: any }>(`/admin/services/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response.service;
    }

    async deleteService(id: string): Promise<{ success: boolean; message: string }> {
        return this.request<{ success: boolean; message: string }>(`/admin/services/${id}`, {
            method: 'DELETE',
        });
    }

    async getServicesByPlatform(platformId: string): Promise<{ success: boolean; platform: PlatformConfig; services: ServiceConfig[] }> {
        return this.request<any>(`/admin/platforms/${platformId}/services`);
    }

    // Dashboard API
    async getDashboardStats(timeRange: string = '30d', startDate?: string, endDate?: string): Promise<any> {
        const queryParams = new URLSearchParams();
        queryParams.append('timeRange', timeRange);
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);

        return this.request<any>(`/admin/dashboard/stats?${queryParams}`);
    }

    async getChartData(timeRange: string = '30d'): Promise<any> {
        return this.request<any>(`/admin/dashboard/chart?timeRange=${timeRange}`);
    }

    async getRecentActivity(): Promise<any> {
        return this.request<any>(`/admin/dashboard/recent-activity`);
    }

    // Tasks API
    async getTasks(params: FilterParams = {}): Promise<PaginatedResponse<any>> {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });

        const response = await this.request<{ tasks: any[]; pagination: any }>(`/admin/tasks?${queryParams}`);
        const mapped = (response.tasks || []).map((t: any) => {
            const user = t.user || t.creator || {};
            return {
                ...t,
                userId: t.userId || user.id,
                userName: user.username || [user.firstName, user.lastName].filter(Boolean).join(' '),
                userEmail: user.email,
                targetUrl: t.target_url || t.targetUrl,
                remainingQuantity: t.remaining_quantity || t.remainingQuantity,
                adminStatus: t.admin_status || t.adminStatus,
                createdAt: t.created_at || t.createdAt,
                updatedAt: t.updated_at || t.updatedAt,
                rate: typeof t.rate === 'string' ? parseFloat(t.rate) : t.rate,
            };
        });
        return {
            data: mapped,
            pagination: response.pagination
        };
    }

    async getTaskById(id: string): Promise<any> {
        return this.request<any>(`/admin/tasks/${id}`);
    }

    async updateTaskStatus(id: string, admin_status: string, notes?: string): Promise<any> {
        return this.request<any>(`/admin/tasks/${id}/status`, {
            method: 'POST',
            body: JSON.stringify({ admin_status, notes }),
        });
    }

    async approveTask(id: string, notes?: string): Promise<any> {
        return this.request<any>(`/admin/tasks/${id}/approve`, {
            method: 'POST',
            body: JSON.stringify({ notes }),
        });
    }

    async rejectTask(id: string, reason?: string, notes?: string): Promise<any> {
        return this.request<any>(`/admin/tasks/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason, notes }),
        });
    }

    // Uncompleted Tasks (claimed but not finished within 1 hour)
    async getUncompletedTasks(params: FilterParams = {}): Promise<PaginatedResponse<any>> {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });
        return this.request<any>(`/admin/tasks/uncompleted?${queryParams}`);
    }

    // Task Screenshot Submissions
    async getSubmittedTasks(params?: any): Promise<any> {
        const queryParams = new URLSearchParams(params).toString();
        return this.request<any>(`/tasks/admin/submitted?${queryParams}`);
    }

    async approveTaskScreenshot(id: string): Promise<any> {
        return this.request<any>(`/tasks/admin/${id}/approve`, {
            method: 'POST',
        });
    }

    async rejectTaskScreenshot(id: string, reason: string): Promise<any> {
        return this.request<any>(`/tasks/admin/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    }

    // Settings API
    async updateSetting(key: string, value: any): Promise<any> {
        return this.request<any>('/admin/settings', {
            method: 'PUT',
            body: JSON.stringify({ key, value }),
        });
    }

    // RBAC API
    async getRoles(): Promise<any> {
        return this.request<any>('/admin/rbac/roles');
    }

    async getPermissions(): Promise<any> {
        return this.request<any>('/admin/rbac/permissions');
    }

    async getRolePermissions(roleId: number): Promise<any> {
        return this.request<any>(`/admin/rbac/roles/${roleId}/permissions`);
    }

    async updateRolePermission(roleId: number, permissionKey: string, mode: string, allow: boolean): Promise<any> {
        return this.request<any>(`/admin/rbac/roles/${roleId}/permissions`, {
            method: 'POST',
            body: JSON.stringify({ permissionKey, mode, allow }),
        });
    }

    async deleteRolePermission(roleId: number, permissionId: number): Promise<any> {
        return this.request<any>(`/admin/rbac/roles/${roleId}/permissions/${permissionId}`, {
            method: 'DELETE',
        });
    }

    async getUserRoles(userId: string): Promise<any> {
        return this.request<any>(`/admin/rbac/users/${userId}/roles`);
    }

    async assignUserRole(userId: string, roleId: number): Promise<any> {
        return this.request<any>(`/admin/rbac/users/${userId}/roles`, {
            method: 'POST',
            body: JSON.stringify({ role_id: roleId }),
        });
    }

    async removeUserRole(userId: string, roleId: number): Promise<any> {
        return this.request<any>(`/admin/rbac/users/${userId}/roles/${roleId}`, {
            method: 'DELETE',
        });
    }

    async clearRBACCache(): Promise<any> {
        return this.request<any>('/admin/rbac/cache/clear', {
            method: 'POST',
        });
    }

    // Email API
    async getEmailTemplates(params?: { page?: number; limit?: number; search?: string; category?: string; isActive?: boolean }): Promise<any> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.category) queryParams.append('category', params.category);
        if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

        const query = queryParams.toString();
        return this.request<any>(`/admin/emails/templates${query ? `?${query}` : ''}`);
    }

    async getEmailTemplate(id: number): Promise<any> {
        return this.request<any>(`/admin/emails/templates/${id}`);
    }

    async createEmailTemplate(data: any): Promise<any> {
        return this.request<any>('/admin/emails/templates', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateEmailTemplate(id: number, data: any): Promise<any> {
        return this.request<any>(`/admin/emails/templates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteEmailTemplate(id: number): Promise<any> {
        return this.request<any>(`/admin/emails/templates/${id}`, {
            method: 'DELETE',
        });
    }

    async previewEmailTemplate(id: number, variables: any): Promise<any> {
        return this.request<any>(`/admin/emails/templates/${id}/preview`, {
            method: 'POST',
            body: JSON.stringify({ variables }),
        });
    }

    async sendEmail(data: { templateId: number; recipientEmail: string; recipientName?: string; variables?: any }): Promise<any> {
        return this.request<any>('/admin/emails/send', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async sendCustomEmail(data: { recipientEmail: string; recipientName?: string; subject: string; bodyHtml: string; bodyText?: string }): Promise<any> {
        return this.request<any>('/admin/emails/send-custom', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async sendBulkEmail(data: { templateId: number; recipients: Array<{ email: string; name?: string; variables?: any }> }): Promise<any> {
        return this.request<any>('/admin/emails/send-bulk', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getEmailLogs(params?: { page?: number; limit?: number; search?: string; status?: string; templateId?: number }): Promise<any> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.templateId) queryParams.append('templateId', params.templateId.toString());

        const query = queryParams.toString();
        return this.request<any>(`/admin/emails/logs${query ? `?${query}` : ''}`);
    }

    async getEmailLog(id: number): Promise<any> {
        return this.request<any>(`/admin/emails/logs/${id}`);
    }

    async getEmailStats(): Promise<any> {
        return this.request<any>('/admin/emails/stats');
    }

    async getEmailSettings(): Promise<any> {
        return this.request<any>('/admin/emails/settings', {
            method: 'GET',
        });
    }

    async updateEmailSettings(data: { host: string; port: number; secure: boolean; user: string; password?: string; fromEmail: string; fromName: string; replyTo?: string }): Promise<any> {
        return this.request<any>('/admin/emails/settings', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async testEmailSettings(data: { testEmail: string }): Promise<any> {
        return this.request<any>('/admin/emails/settings/test', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Social Accounts API
    async getSocialAccounts(params?: { page?: number; limit?: number; search?: string; platform?: string; status?: string; sortBy?: string; sortOrder?: string }): Promise<any> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.platform) queryParams.append('platform', params.platform);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const query = queryParams.toString();
        return this.request<any>(`/admin/social-accounts${query ? `?${query}` : ''}`);
    }

    async getSocialAccountStats(): Promise<any> {
        return this.request<any>('/admin/social-accounts/stats');
    }

    async getSocialAccountById(id: string): Promise<any> {
        return this.request<any>(`/admin/social-accounts/${id}`);
    }

    async updateSocialAccountStatus(id: string, status: string): Promise<any> {
        return this.request<any>(`/admin/social-accounts/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    async deleteSocialAccount(id: string): Promise<any> {
        return this.request<any>(`/admin/social-accounts/${id}`, {
            method: 'DELETE',
        });
    }

    async refreshSocialAccount(id: string): Promise<any> {
        return this.request<any>(`/admin/social-accounts/${id}/refresh`, {
            method: 'POST',
        });
    }

    // API Keys Management
    async getUserApiKey(userId: string): Promise<any> {
        return this.request<any>(`/admin/api-keys/user/${userId}`);
    }

    async getUserApiLogs(userId: string, params?: { page?: number; limit?: number; endpoint?: string; method?: string; status?: string }): Promise<any> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.endpoint) queryParams.append('endpoint', params.endpoint);
        if (params?.method) queryParams.append('method', params.method);
        if (params?.status) queryParams.append('status', params.status);

        const query = queryParams.toString();
        return this.request<any>(`/admin/api-keys/user/${userId}/logs${query ? `?${query}` : ''}`);
    }

    async updateApiKeyStatus(apiKeyId: string, status: string): Promise<any> {
        return this.request<any>(`/admin/api-keys/${apiKeyId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    async deleteApiKey(apiKeyId: string): Promise<any> {
        return this.request<any>(`/admin/api-keys/${apiKeyId}`, {
            method: 'DELETE',
        });
    }

    async getApiLogDetail(logId: string): Promise<any> {
        return this.request<any>(`/admin/api-keys/logs/${logId}`);
    }

    async updateApiKeyRateLimit(apiKeyId: string, rateLimit: number): Promise<any> {
        return this.request<any>(`/admin/api-keys/${apiKeyId}/rate-limit`, {
            method: 'PUT',
            body: JSON.stringify({ rateLimit }),
        });
    }

    async updateApiKeyAllowedIps(apiKeyId: string, allowedIps: string[]): Promise<any> {
        return this.request<any>(`/admin/api-keys/${apiKeyId}/allowed-ips`, {
            method: 'PUT',
            body: JSON.stringify({ allowedIps }),
        });
    }
}


export const realApiService = new RealApiService();