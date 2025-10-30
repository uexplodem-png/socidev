import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';
import SystemSettings from '../models/SystemSettings.js';
import logger from '../config/logger.js';

/**
 * All permissions in the system grouped by category
 */
const PERMISSIONS = {
  // Dashboard
  dashboard: [
    { key: 'dashboard.view', label: 'View Dashboard', group: 'dashboard' },
    { key: 'dashboard.analytics', label: 'View Analytics', group: 'dashboard' },
  ],

  // Users Management
  users: [
    { key: 'users.view', label: 'View Users', group: 'users' },
    { key: 'users.create', label: 'Create Users', group: 'users' },
    { key: 'users.edit', label: 'Edit Users', group: 'users' },
    { key: 'users.delete', label: 'Delete Users', group: 'users' },
    { key: 'users.suspend', label: 'Suspend Users', group: 'users' },
    { key: 'users.ban', label: 'Ban Users', group: 'users' },
    { key: 'users.verify', label: 'Verify Users', group: 'users' },
    { key: 'users.balance', label: 'Manage User Balance', group: 'users' },
  ],

  // Orders Management
  orders: [
    { key: 'orders.view', label: 'View Orders', group: 'orders' },
    { key: 'orders.create', label: 'Create Orders', group: 'orders' },
    { key: 'orders.edit', label: 'Edit Orders', group: 'orders' },
    { key: 'orders.delete', label: 'Delete Orders', group: 'orders' },
    { key: 'orders.cancel', label: 'Cancel Orders', group: 'orders' },
    { key: 'orders.refund', label: 'Refund Orders', group: 'orders' },
  ],

  // Tasks Management
  tasks: [
    { key: 'tasks.view', label: 'View Tasks', group: 'tasks' },
    { key: 'tasks.create', label: 'Create Tasks', group: 'tasks' },
    { key: 'tasks.edit', label: 'Edit Tasks', group: 'tasks' },
    { key: 'tasks.delete', label: 'Delete Tasks', group: 'tasks' },
    { key: 'tasks.approve', label: 'Approve Tasks', group: 'tasks' },
    { key: 'tasks.reject', label: 'Reject Tasks', group: 'tasks' },
    { key: 'tasks.review_screenshots', label: 'Review Task Screenshots', group: 'tasks' },
  ],

  // Transactions Management
  transactions: [
    { key: 'transactions.view', label: 'View Transactions', group: 'transactions' },
    { key: 'transactions.create', label: 'Create Transactions', group: 'transactions' },
    { key: 'transactions.approve', label: 'Approve Transactions', group: 'transactions' },
    { key: 'transactions.reject', label: 'Reject Transactions', group: 'transactions' },
    { key: 'transactions.adjust', label: 'Adjust Transactions', group: 'transactions' },
  ],

  // Withdrawals Management
  withdrawals: [
    { key: 'withdrawals.view', label: 'View Withdrawals', group: 'withdrawals' },
    { key: 'withdrawals.create', label: 'Create Withdrawals', group: 'withdrawals' },
    { key: 'withdrawals.approve', label: 'Approve Withdrawals', group: 'withdrawals' },
    { key: 'withdrawals.reject', label: 'Reject Withdrawals', group: 'withdrawals' },
    { key: 'withdrawals.process', label: 'Process Withdrawals', group: 'withdrawals' },
  ],

  // Disputes Management
  disputes: [
    { key: 'disputes.view', label: 'View Disputes', group: 'disputes' },
    { key: 'disputes.respond', label: 'Respond to Disputes', group: 'disputes' },
    { key: 'disputes.resolve', label: 'Resolve Disputes', group: 'disputes' },
    { key: 'disputes.close', label: 'Close Disputes', group: 'disputes' },
  ],

  // Platform & Services
  platforms: [
    { key: 'platforms.view', label: 'View Platforms', group: 'platforms' },
    { key: 'platforms.create', label: 'Create Platforms', group: 'platforms' },
    { key: 'platforms.edit', label: 'Edit Platforms', group: 'platforms' },
    { key: 'platforms.delete', label: 'Delete Platforms', group: 'platforms' },
  ],

  services: [
    { key: 'services.view', label: 'View Services', group: 'services' },
    { key: 'services.create', label: 'Create Services', group: 'services' },
    { key: 'services.edit', label: 'Edit Services', group: 'services' },
    { key: 'services.delete', label: 'Delete Services', group: 'services' },
  ],

  // Settings Management
  settings: [
    { key: 'settings.view', label: 'View Settings', group: 'settings' },
    { key: 'settings.edit', label: 'Edit Settings', group: 'settings' },
    { key: 'settings.system', label: 'Manage System Settings', group: 'settings' },
  ],

  // Roles & Permissions
  roles: [
    { key: 'roles.view', label: 'View Roles', group: 'roles' },
    { key: 'roles.create', label: 'Create Roles', group: 'roles' },
    { key: 'roles.edit', label: 'Edit Roles', group: 'roles' },
    { key: 'roles.delete', label: 'Delete Roles', group: 'roles' },
    { key: 'roles.assign', label: 'Assign Roles', group: 'roles' },
  ],

  permissions: [
    { key: 'permissions.view', label: 'View Permissions', group: 'permissions' },
    { key: 'permissions.manage', label: 'Manage Permissions', group: 'permissions' },
  ],

  // Audit & Activity Logs
  audit: [
    { key: 'audit.view', label: 'View Audit Logs', group: 'audit' },
    { key: 'activity.view', label: 'View Activity Logs', group: 'audit' },
  ],

  // Reports & Analytics
  reports: [
    { key: 'reports.view', label: 'View Reports', group: 'reports' },
    { key: 'reports.export', label: 'Export Reports', group: 'reports' },
    { key: 'reports.financial', label: 'View Financial Reports', group: 'reports' },
  ],

  // Social Accounts
  socialAccounts: [
    { key: 'social_accounts.view', label: 'View Social Accounts', group: 'social_accounts' },
    { key: 'social_accounts.manage', label: 'Manage Social Accounts', group: 'social_accounts' },
    { key: 'social_accounts.verify', label: 'Verify Social Accounts', group: 'social_accounts' },
  ],

  // Accounts (alias for social_accounts for frontend compatibility)
  accounts: [
    { key: 'accounts.view', label: 'View Accounts', group: 'accounts' },
    { key: 'accounts.create', label: 'Create Accounts', group: 'accounts' },
    { key: 'accounts.edit', label: 'Edit Accounts', group: 'accounts' },
    { key: 'accounts.delete', label: 'Delete Accounts', group: 'accounts' },
  ],

  // Instagram Management
  instagram: [
    { key: 'instagram.view', label: 'View Instagram Accounts', group: 'instagram' },
    { key: 'instagram.manage', label: 'Manage Instagram Accounts', group: 'instagram' },
  ],

  // Devices
  devices: [
    { key: 'devices.view', label: 'View Devices', group: 'devices' },
    { key: 'devices.create', label: 'Create Devices', group: 'devices' },
    { key: 'devices.manage', label: 'Manage Devices', group: 'devices' },
    { key: 'devices.ban', label: 'Ban Devices', group: 'devices' },
  ],

  // API Keys
  apiKeys: [
    { key: 'api_keys.view', label: 'View API Keys', group: 'api_keys' },
    { key: 'api_keys.create', label: 'Create API Keys', group: 'api_keys' },
    { key: 'api_keys.revoke', label: 'Revoke API Keys', group: 'api_keys' },
  ],

  // Analytics
  analytics: [
    { key: 'analytics.view', label: 'View Analytics', group: 'analytics' },
    { key: 'analytics.export', label: 'Export Analytics', group: 'analytics' },
  ],

  // Balance Management
  balance: [
    { key: 'balance.view', label: 'View Balance', group: 'balance' },
    { key: 'balance.adjust', label: 'Adjust Balance', group: 'balance' },
  ],

  // Audit Logs
  auditLogs: [
    { key: 'audit_logs.view', label: 'View Audit Logs', group: 'audit_logs' },
    { key: 'audit_logs.export', label: 'Export Audit Logs', group: 'audit_logs' },
  ],

  // Action Logs
  actionLogs: [
    { key: 'action_logs.view', label: 'View Action Logs', group: 'action_logs' },
    { key: 'action_logs.export', label: 'Export Action Logs', group: 'action_logs' },
  ],
};

/**
 * Role definitions with their permissions
 */
const ROLES = {
  super_admin: {
    key: 'super_admin',
    label: 'Super Admin',
    permissions: '*', // All permissions
  },
  admin: {
    key: 'admin',
    label: 'Admin',
    permissions: [
      // Dashboard
      'dashboard.view', 'dashboard.analytics',
      // Analytics
      'analytics.view', 'analytics.export',
      // Users (limited)
      'users.view', 'users.edit', 'users.suspend', 'users.verify', 'users.balance',
      // Balance
      'balance.view', 'balance.adjust',
      // Orders
      'orders.view', 'orders.edit', 'orders.cancel', 'orders.refund',
      // Tasks
      'tasks.view', 'tasks.edit', 'tasks.approve', 'tasks.reject', 'tasks.review_screenshots',
      // Transactions
      'transactions.view', 'transactions.approve', 'transactions.reject', 'transactions.adjust',
      // Withdrawals
      'withdrawals.view', 'withdrawals.approve', 'withdrawals.reject', 'withdrawals.process',
      // Disputes
      'disputes.view', 'disputes.respond', 'disputes.resolve', 'disputes.close',
      // Platforms & Services
      'platforms.view', 'platforms.edit',
      'services.view', 'services.edit',
      // Settings (limited)
      'settings.view', 'settings.edit',
      // Audit & Logs
      'audit.view', 'activity.view',
      'audit_logs.view', 'audit_logs.export',
      'action_logs.view', 'action_logs.export',
      // Reports
      'reports.view', 'reports.export', 'reports.financial',
      // Social Accounts
      'social_accounts.view', 'social_accounts.manage', 'social_accounts.verify',
      // Instagram
      'instagram.view', 'instagram.manage',
      // Devices
      'devices.view', 'devices.manage', 'devices.ban',
      // API Keys
      'api_keys.view',
    ],
  },
  moderator: {
    key: 'moderator',
    label: 'Moderator',
    permissions: [
      // Dashboard
      'dashboard.view',
      // Analytics
      'analytics.view',
      // Users (view only)
      'users.view',
      // Balance
      'balance.view',
      // Orders
      'orders.view', 'orders.edit',
      // Tasks
      'tasks.view', 'tasks.edit', 'tasks.approve', 'tasks.reject', 'tasks.review_screenshots',
      // Transactions
      'transactions.view',
      // Withdrawals
      'withdrawals.view',
      // Disputes
      'disputes.view', 'disputes.respond',
      // Platforms & Services
      'platforms.view', 'services.view',
      // Audit & Logs
      'activity.view',
      'audit_logs.view',
      'action_logs.view',
      // Reports
      'reports.view',
      // Social Accounts
      'social_accounts.view', 'social_accounts.verify',
      // Instagram
      'instagram.view',
      // Devices
      'devices.view',
    ],
  },
  task_giver: {
    key: 'task_giver',
    label: 'Task Giver',
    permissions: [
      'dashboard.view',
      'orders.view', 'orders.create',
      'tasks.view',
      'transactions.view', 'transactions.create',
      'disputes.view',
      'social_accounts.view',
      'accounts.view',
    ],
  },
  task_doer: {
    key: 'task_doer',
    label: 'Task Doer',
    permissions: [
      'dashboard.view',
      'tasks.view',
      'transactions.view',
      'withdrawals.view', 'withdrawals.create',
      'social_accounts.view',
      'accounts.view', 'accounts.create',
      'instagram.view',
      'devices.view', 'devices.create',
    ],
  },
};

/**
 * Default system settings
 */
const DEFAULT_SETTINGS = {
  site: {
    name: 'Social Developer',
    description: 'Social Media Management Platform',
    logo: '/logo.png',
    favicon: '/favicon.ico',
  },
  maintenance: {
    enabled: false,
    message: 'System is under maintenance. Please try again later.',
  },
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 15, // minutes
    sessionTimeout: 24, // hours
    passwordMinLength: 8,
    requireStrongPassword: true,
    twoFactorRequired: false,
  },
  tasks: {
    minRate: 0.001,
    maxRate: 10.0,
    defaultCooldown: 24, // hours
    screenshotRequired: true,
    autoApproval: false,
  },
  orders: {
    minAmount: 1.0,
    maxAmount: 10000.0,
    autoRefund: false,
    refundWindow: 7, // days
  },
  withdrawals: {
    minAmount: 10.0,
    maxAmount: 10000.0,
    processingTime: 24, // hours
    fee: 0, // percentage
    methods: ['bank_transfer', 'crypto', 'paypal'],
  },
  notifications: {
    email: true,
    browser: true,
    newOrder: true,
    taskCompleted: true,
    withdrawalProcessed: true,
  },
};

/**
 * Initialize permissions in the database
 * NOTE: Permissions are now managed via seeders (20251030041800-seed-permissions.cjs)
 * This function only checks if permissions exist
 */
async function initializePermissions() {
  try {
    const permissionCount = await Permission.count();
    
    if (permissionCount === 0) {
      logger.warn('⚠️  No permissions found in database. Run: npm run seed');
      logger.warn('⚠️  Permissions should be created via seeders, not InitDB');
    } else {
      logger.info(`✅ Found ${permissionCount} permissions in database`);
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Failed to check permissions:', error);
    throw error;
  }
}

/**
 * Initialize roles in the database
 * NOTE: Roles and role-permission mappings are now managed via seeders:
 * - User roles: migrations/seeders (role_permissions table)
 * - Admin roles: 20251030041900-seed-admin-role-permissions.cjs
 * This function only checks if roles exist
 */
async function initializeRoles() {
  try {
    const roleCount = await Role.count();
    
    if (roleCount === 0) {
      logger.warn('⚠️  No roles found in database. Run: npm run seed');
      logger.warn('⚠️  Roles should be created via seeders, not InitDB');
    } else {
      logger.info(`✅ Found ${roleCount} roles in database`);
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Failed to check roles:', error);
    throw error;
  }
}

/**
 * Initialize system settings
 */
async function initializeSettings() {
  try {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const [setting, created] = await SystemSettings.findOrCreate({
        where: { key },
        defaults: {
          key,
          value,
          description: `Default ${key} settings`,
        },
      });
      
      if (created) {
        logger.info(`✅ Created system setting: ${key}`);
      }
    }
    
    logger.info(`✅ Initialized ${Object.keys(DEFAULT_SETTINGS).length} system settings`);
    return true;
  } catch (error) {
    logger.error('❌ Failed to initialize settings:', error);
    throw error;
  }
}

/**
 * Main initialization function
 * This runs on every server start
 * 
 * NOTE: Permissions and Roles are managed via seeders:
 * - Permissions: 20251030041800-seed-permissions.cjs
 * - Admin Role Permissions: 20251030041900-seed-admin-role-permissions.cjs
 * - To load data: npm run seed
 * 
 * This function only:
 * 1. Checks if data exists
 * 2. Initializes system settings
 */
export async function initializeDatabase() {
  try {
    logger.info('🔄 Checking database initialization...');
    
    // Check permissions (should be loaded via seeder)
    await initializePermissions();
    
    // Check roles (should be loaded via seeder)
    await initializeRoles();
    
    // Initialize system settings (can be created here)
    await initializeSettings();
    
    logger.info('✅ Database initialization check completed!');
    return true;
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Force re-initialization (useful for updates)
 * This updates existing permissions and roles
 */
export async function reinitializeDatabase() {
  try {
    logger.info('🔄 Starting database re-initialization...');
    
    await initializePermissions();
    await initializeRoles();
    await initializeSettings();
    
    logger.info('✅ Database re-initialization completed!');
    return true;
  } catch (error) {
    logger.error('❌ Database re-initialization failed:', error);
    throw error;
  }
}

export { PERMISSIONS, ROLES, DEFAULT_SETTINGS };
