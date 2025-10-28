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

  // Instagram Management
  instagram: [
    { key: 'instagram.view', label: 'View Instagram Accounts', group: 'instagram' },
    { key: 'instagram.manage', label: 'Manage Instagram Accounts', group: 'instagram' },
  ],

  // Devices
  devices: [
    { key: 'devices.view', label: 'View Devices', group: 'devices' },
    { key: 'devices.manage', label: 'Manage Devices', group: 'devices' },
    { key: 'devices.ban', label: 'Ban Devices', group: 'devices' },
  ],

  // API Keys
  apiKeys: [
    { key: 'api_keys.view', label: 'View API Keys', group: 'api_keys' },
    { key: 'api_keys.create', label: 'Create API Keys', group: 'api_keys' },
    { key: 'api_keys.revoke', label: 'Revoke API Keys', group: 'api_keys' },
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
      // Users (limited)
      'users.view', 'users.edit', 'users.suspend', 'users.verify', 'users.balance',
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
      // Audit
      'audit.view', 'activity.view',
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
      // Users (view only)
      'users.view',
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
      // Audit
      'activity.view',
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
      'transactions.view',
      'disputes.view',
      'social_accounts.view',
    ],
  },
  task_doer: {
    key: 'task_doer',
    label: 'Task Doer',
    permissions: [
      'dashboard.view',
      'tasks.view',
      'transactions.view',
      'withdrawals.view',
      'social_accounts.view',
      'instagram.view',
      'devices.view',
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
 */
async function initializePermissions() {
  try {
    const allPermissions = Object.values(PERMISSIONS).flat();
    
    for (const permission of allPermissions) {
      const [perm, created] = await Permission.findOrCreate({
        where: { key: permission.key },
        defaults: permission,
      });
      
      if (created) {
        logger.info(`✅ Created permission: ${permission.key}`);
      }
    }
    
    logger.info(`✅ Initialized ${allPermissions.length} permissions`);
    return true;
  } catch (error) {
    logger.error('❌ Failed to initialize permissions:', error);
    throw error;
  }
}

/**
 * Initialize roles in the database
 */
async function initializeRoles() {
  try {
    for (const [roleName, roleData] of Object.entries(ROLES)) {
      const [role, created] = await Role.findOrCreate({
        where: { key: roleData.key },
        defaults: {
          key: roleData.key,
          label: roleData.label,
        },
      });
      
      if (created) {
        logger.info(`✅ Created role: ${roleData.key}`);
      }
      
      // Assign permissions to role
      let permissionsToAssign = [];
      
      if (roleData.permissions === '*') {
        // Super admin gets all permissions
        permissionsToAssign = await Permission.findAll();
      } else {
        // Find permissions by keys
        permissionsToAssign = await Permission.findAll({
          where: { key: roleData.permissions },
        });
      }
      
      // Clear existing permissions for this role
      await RolePermission.destroy({
        where: { role_id: role.id },
      });
      
      // Assign new permissions
      for (const permission of permissionsToAssign) {
        await RolePermission.findOrCreate({
          where: {
            role_id: role.id,
            permission_id: permission.id,
          },
          defaults: {
            roleId: role.id,
            permissionId: permission.id,
            mode: 'all',
            allow: 1
          }
        });
      }
      
      logger.info(`✅ Assigned ${permissionsToAssign.length} permissions to ${roleData.key}`);
    }
    
    logger.info(`✅ Initialized ${Object.keys(ROLES).length} roles`);
    return true;
  } catch (error) {
    logger.error('❌ Failed to initialize roles:', error);
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
 * This runs on every server start but only creates missing data
 */
export async function initializeDatabase() {
  try {
    logger.info('🔄 Checking database initialization...');
    
    // Check if already initialized
    const permissionCount = await Permission.count();
    const roleCount = await Role.count();
    
    if (permissionCount > 0 && roleCount > 0) {
      logger.info('✅ Database already initialized');
      return true;
    }
    
    logger.info('🚀 Starting database initialization...');
    
    // Initialize in order (permissions -> roles -> settings)
    await initializePermissions();
    await initializeRoles();
    await initializeSettings();
    
    logger.info('✅ Database initialization completed successfully!');
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
