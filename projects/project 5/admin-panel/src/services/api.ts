import {
  User,
  LoginCredentials,
  FilterParams,
} from '../types';

// Import the real API service
import { realApiService } from './realApi';

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials) => {
    const response = await realApiService.login(credentials);
    return response.data;
  },

  validateToken: async () => {
    const response = await realApiService.validateToken();
    return response.data;
  },

  logout: async () => {
    await realApiService.logout();
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async (timeRange: string = '30d') => {
    try {
      const response = await realApiService.getDashboardStats(timeRange);
      return response;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return empty stats on error to prevent UI crashes
      return {
        revenue: { total: 0, change: 0, period: timeRange },
        users: { total: 0, active: 0, change: 0 },
        orders: { total: 0, processing: 0, completed: 0, change: 0 },
        tasks: { total: 0, pending: 0, approved: 0, change: 0 },
        withdrawals: { pending: 0, amount: 0, change: 0 },
      };
    }
  },

  getChartData: async (timeRange: string = '30d') => {
    try {
      const response = await realApiService.getChartData(timeRange);
      // Transform the response to match expected format
      return response.map((item: any) => ({
        name: item.dateFormatted || item.date,
        revenue: item.revenue || 0,
        users: item.users || 0,
        orders: item.orders || 0,
        tasks: item.tasks || 0,
      }));
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Return empty array on error
      return [];
    }
  },
};

// Settings API
export const settingsAPI = {
  get: async () => {
    return realApiService.getSettings();
  },
  update: async (key: string, value: any) => {
    return realApiService.updateSetting(key, value);
  },
  resetData: async () => {
    return realApiService.resetData();
  }
};

// RBAC API
export const rbacAPI = {
  getRoles: async () => {
    return realApiService.getRoles();
  },
  getPermissions: async () => {
    return realApiService.getPermissions();
  },
  getRolePermissions: async (roleId: number) => {
    return realApiService.getRolePermissions(roleId);
  },
  updateRolePermission: async (roleId: number, permissionKey: string, mode: string, allow: boolean) => {
    return realApiService.updateRolePermission(roleId, permissionKey, mode, allow);
  },
  deleteRolePermission: async (roleId: number, permissionId: number) => {
    return realApiService.deleteRolePermission(roleId, permissionId);
  },
  getUserRoles: async (userId: string) => {
    return realApiService.getUserRoles(userId);
  },
  assignUserRole: async (userId: string, roleId: number) => {
    return realApiService.assignUserRole(userId, roleId);
  },
  removeUserRole: async (userId: string, roleId: number) => {
    return realApiService.removeUserRole(userId, roleId);
  },
  clearCache: async () => {
    return realApiService.clearRBACCache();
  }
};

// Email API
export const emailAPI = {
  getTemplates: async (params?: { page?: number; limit?: number; search?: string; category?: string; isActive?: boolean }) => {
    return realApiService.getEmailTemplates(params);
  },
  getTemplate: async (id: number) => {
    return realApiService.getEmailTemplate(id);
  },
  createTemplate: async (data: any) => {
    return realApiService.createEmailTemplate(data);
  },
  updateTemplate: async (id: number, data: any) => {
    return realApiService.updateEmailTemplate(id, data);
  },
  deleteTemplate: async (id: number) => {
    return realApiService.deleteEmailTemplate(id);
  },
  previewTemplate: async (id: number, variables: any) => {
    return realApiService.previewEmailTemplate(id, variables);
  },
  send: async (data: { templateId: number; recipientEmail: string; recipientName?: string; variables?: any }) => {
    return realApiService.sendEmail(data);
  },
  sendCustom: async (data: { recipientEmail: string; recipientName?: string; subject: string; bodyHtml: string; bodyText?: string }) => {
    return realApiService.sendCustomEmail(data);
  },
  sendBulk: async (data: { templateId: number; recipients: Array<{ email: string; name?: string; variables?: any }> }) => {
    return realApiService.sendBulkEmail(data);
  },
  getLogs: async (params?: { page?: number; limit?: number; search?: string; status?: string; templateId?: number }) => {
    return realApiService.getEmailLogs(params);
  },
  getLog: async (id: number) => {
    return realApiService.getEmailLog(id);
  },
  getStats: async () => {
    return realApiService.getEmailStats();
  }
};

// Mock Data API
export const mockDataAPI = {
  resetData: async () => {
    // For now, just return a resolved promise
    // In a real implementation, this would reset the mock data
    return Promise.resolve();
  },

  exportData: () => {
    // For now, return empty string
    return '{}';
  },

  importData: () => {
    // For now, just return true
    return true;
  },

  getMockData: () => {
    // For now, return empty object
    return {};
  }
};

// Users API
export const usersAPI = {
  getUsers: async (params: FilterParams) => {
    return realApiService.getUsers(params);
  },

  getUserById: async (id: string) => {
    const response = await realApiService.getUserById(id);
    return response.user;
  },

  createUser: async (userData: Partial<User>) => {
    return realApiService.createUser(userData);
  },

  updateUser: async (id: string, updates: Partial<User>) => {
    return realApiService.updateUser(id, updates);
  },

  suspendUser: async (id: string, reason?: string) => {
    return realApiService.suspendUser(id, reason);
  },

  activateUser: async (id: string) => {
    return realApiService.activateUser(id);
  },

  adjustUserBalance: async (id: string, amount: number, type: 'add' | 'subtract', reason: string) => {
    return realApiService.adjustUserBalance(id, amount, type, reason);
  },

  getUserTransactions: async (userId: string, params: FilterParams) => {
    return realApiService.getUserTransactions(userId, params);
  },

  getUserOrders: async (userId: string, params: FilterParams = {}) => {
    return realApiService.getUserOrders(userId, params);
  },
};

// Orders API
export const ordersAPI = {
  getOrders: async (params: FilterParams) => {
    return realApiService.getOrders(params);
  },

  getOrderById: async (id: string) => {
    return realApiService.getOrderById(id);
  },

  updateOrderStatus: async (id: string, status: string, notes?: string) => {
    return realApiService.updateOrderStatus(id, status, notes);
  },

  refundOrder: async (id: string) => {
    return realApiService.refundOrder(id);
  },
};

// Withdrawals API
export const withdrawalsAPI = {
  getWithdrawals: async (params: FilterParams) => {
    return realApiService.getWithdrawals(params);
  },

  getTransactions: async (params: FilterParams) => {
    return realApiService.getTransactions(params);
  },

  createTransaction: async (data: any) => {
    return realApiService.createTransaction(data);
  },

  approveWithdrawal: async (transactionId: string, notes?: string) => {
    return realApiService.approveWithdrawal(transactionId, notes);
  },

  rejectWithdrawal: async (transactionId: string, notes?: string) => {
    return realApiService.rejectWithdrawal(transactionId, notes);
  },
};

// Audit Logs API
export const auditLogsAPI = {
  getAuditLogs: async (params: FilterParams & { action?: string; resource?: string }) => {
    return realApiService.getAuditLogs(params);
  },

  getAuditLogStats: async (timeRange: string = '30d') => {
    return realApiService.getAuditLogStats(timeRange);
  },

  exportAuditLogs: async (filters: any) => {
    return realApiService.exportAuditLogs(filters);
  },
};

// Tasks API
export const tasksAPI = {
  getTasks: async (params: FilterParams = {}) => {
    return realApiService.getTasks(params);
  },

  getTaskById: async (id: string) => {
    return realApiService.getTaskById(id);
  },

  updateTaskStatus: async (id: string, admin_status: string, notes?: string) => {
    return realApiService.updateTaskStatus(id, admin_status, notes);
  },

  approveTask: async (id: string, notes?: string) => {
    return realApiService.approveTask(id, notes);
  },

  rejectTask: async (id: string, reason?: string, notes?: string) => {
    return realApiService.rejectTask(id, reason, notes);
  },

  // Uncompleted tasks
  getUncompletedTasks: async (params: FilterParams = {}) => {
    return realApiService.getUncompletedTasks(params);
  },

  // Screenshot submission approval
  getSubmittedTasks: async (params?: any) => {
    return realApiService.getSubmittedTasks(params);
  },

  approveTaskScreenshot: async (id: string) => {
    return realApiService.approveTaskScreenshot(id);
  },

  rejectTaskScreenshot: async (id: string, reason: string) => {
    return realApiService.rejectTaskScreenshot(id, reason);
  },
};