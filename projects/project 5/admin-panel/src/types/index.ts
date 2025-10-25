// Core Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  balance: number;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  permissions: Permission[];
}

export type UserRole = 'task_doer' | 'task_giver' | 'admin' | 'super_admin' | 'moderator';
export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  status: OrderStatus;
  paymentMethod?: string;
  platform: Platform;
  service: string;
  targetUrl: string;
  quantity: number;
  completed: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
  notes?: AdminNote[];
  // Add missing fields from backend model
  startCount?: number;
  remainingCount?: number;
  completedCount?: number;
  speed?: 'normal' | 'fast' | 'express';
  startedAt?: string;
  completedAt?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type Platform = 'instagram' | 'twitter' | 'tiktok' | 'youtube';

export interface AdminNote {
  id: string;
  adminId: string;
  adminName: string;
  content: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'withdraw' | 'order_payment' | 'task_earning' | 'refund' | 'adjustment';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'processing';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: WithdrawalMethod;
  status: WithdrawalStatus;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface WithdrawalMethod {
  id: string;
  name: string;
  type: 'bank' | 'paypal' | 'crypto';
  isActive: boolean;
  minAmount: number;
  maxAmount: number;
  processingTime: string;
}

export interface SocialAccount {
  id: string;
  userId: string;
  platform: Platform;
  username: string;
  status: AccountStatus;
  followers: number;
  lastActivity: string;
  healthScore: number;
  errors: AccountError[];
}

export type AccountStatus = 'active' | 'inactive' | 'error' | 'suspended';

export interface AccountError {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  assignedTo?: string;
  createdBy: string;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  analytics?: TaskAnalytics;
}

export type TaskType = 'like' | 'follow' | 'view' | 'subscribe' | 'comment';
export type TaskStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskAnalytics {
  totalAssigned: number;
  completed: number;
  failed: number;
  averageCompletionTime: number;
  successRate: number;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  userId: string;
  lastSeen: string;
  version: string;
  location: string;
  usage: DeviceUsage;
  configuration: DeviceConfig;
}

export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'server';
export type DeviceStatus = 'online' | 'offline' | 'maintenance' | 'error';

export interface DeviceUsage {
  tasksCompleted: number;
  uptime: number;
  quotaUsed: number;
  quotaLimit: number;
}

export interface DeviceConfig {
  autoUpdate: boolean;
  maxConcurrentTasks: number;
  workingHours: {
    start: string;
    end: string;
  };
}

export interface DashboardStats {
  revenue: {
    total: number;
    change: number;
    period: string;
  };
  users: {
    total: number;
    active: number;
    change: number;
  };
  orders: {
    total: number;
    processing: number;
    completed: number;
    change: number;
  };
  tasks: {
    total: number;
    pending: number;
    approved: number;
    change: number;
  };
  withdrawals: {
    pending: number;
    amount: number;
    change: number;
  };
}

export interface ChartData {
  name: string;
  users?: number;
  orders?: number;
  tasks?: number;
  revenue?: number;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  resource: string;
  targetUserId?: string;
  targetUserName?: string;
  timestamp: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface FilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  permissions: Permission[];
  loading?: boolean;
}

// Platform & Service Management Types
export interface PlatformConfig {
  id: string;
  name: string;
  nameEn?: string;
  nameTr?: string;
  description?: string;
  descriptionEn?: string;
  descriptionTr?: string;
  icon?: string;
  isActive?: boolean;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceConfig {
  id: string;
  platformId: string;
  name: string;
  nameEn?: string;
  nameTr?: string;
  description?: string;
  descriptionEn?: string;
  descriptionTr?: string;
  pricePerUnit: number;
  minOrder: number;
  maxOrder: number;
  inputFieldName: string;
  sampleUrl?: string;
  urlPattern?: string;
  features: string[];
  featuresEn?: string[];
  featuresTr?: string[];
  // Added commission rate field
  commissionRate?: number;
  isActive?: boolean;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

// Task Submission Types
export interface TaskSubmission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  taskId: string;
  taskName: string;
  orderId: string;
  screenshotUrl: string;
  submissionNumber: number;
  status: TaskSubmissionStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export type TaskSubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface TaskSubmissionFilterParams extends FilterParams {
  taskId?: string;
  userId?: string;
  status?: TaskSubmissionStatus;
}