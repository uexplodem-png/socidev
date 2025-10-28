'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert roles
    const roles = [
      { key: 'super_admin', label: 'Super Administrator', created_at: new Date(), updated_at: new Date() },
      { key: 'admin', label: 'Administrator', created_at: new Date(), updated_at: new Date() },
      { key: 'moderator', label: 'Moderator', created_at: new Date(), updated_at: new Date() },
      { key: 'task_giver', label: 'Task Giver', created_at: new Date(), updated_at: new Date() },
      { key: 'task_doer', label: 'Task Doer', created_at: new Date(), updated_at: new Date() }
    ];

    await queryInterface.bulkInsert('roles', roles, { ignoreDuplicates: true });

    // Insert permissions
    const permissions = [
      // Users permissions
      { key: 'users.view', label: 'View Users', group: 'users', created_at: new Date(), updated_at: new Date() },
      { key: 'users.edit', label: 'Edit Users', group: 'users', created_at: new Date(), updated_at: new Date() },
      { key: 'users.create', label: 'Create Users', group: 'users', created_at: new Date(), updated_at: new Date() },
      { key: 'users.ban', label: 'Ban Users', group: 'users', created_at: new Date(), updated_at: new Date() },
      { key: 'users.delete', label: 'Delete Users', group: 'users', created_at: new Date(), updated_at: new Date() },
      
      // Transactions permissions
      { key: 'transactions.view', label: 'View Transactions', group: 'transactions', created_at: new Date(), updated_at: new Date() },
      { key: 'transactions.approve', label: 'Approve Transactions', group: 'transactions', created_at: new Date(), updated_at: new Date() },
      { key: 'transactions.reject', label: 'Reject Transactions', group: 'transactions', created_at: new Date(), updated_at: new Date() },
      { key: 'transactions.adjust', label: 'Adjust Balances', group: 'transactions', created_at: new Date(), updated_at: new Date() },
      { key: 'transactions.create', label: 'Create Transactions', group: 'transactions', created_at: new Date(), updated_at: new Date() },
      
      // Orders permissions
      { key: 'orders.view', label: 'View Orders', group: 'orders', created_at: new Date(), updated_at: new Date() },
      { key: 'orders.edit', label: 'Edit Orders', group: 'orders', created_at: new Date(), updated_at: new Date() },
      { key: 'orders.refund', label: 'Refund Orders', group: 'orders', created_at: new Date(), updated_at: new Date() },
      { key: 'orders.cancel', label: 'Cancel Orders', group: 'orders', created_at: new Date(), updated_at: new Date() },
      
      // Tasks permissions
      { key: 'tasks.view', label: 'View Tasks', group: 'tasks', created_at: new Date(), updated_at: new Date() },
      { key: 'tasks.review', label: 'Review Tasks', group: 'tasks', created_at: new Date(), updated_at: new Date() },
      { key: 'tasks.approve', label: 'Approve Tasks', group: 'tasks', created_at: new Date(), updated_at: new Date() },
      { key: 'tasks.reject', label: 'Reject Tasks', group: 'tasks', created_at: new Date(), updated_at: new Date() },
      
      // Settings permissions
      { key: 'settings.view', label: 'View Settings', group: 'settings', created_at: new Date(), updated_at: new Date() },
      { key: 'settings.edit', label: 'Edit Settings', group: 'settings', created_at: new Date(), updated_at: new Date() },
      
      // Audit logs permissions
      { key: 'audit_logs.view', label: 'View Audit Logs', group: 'audit', created_at: new Date(), updated_at: new Date() },
      { key: 'action_logs.view', label: 'View Action Logs', group: 'audit', created_at: new Date(), updated_at: new Date() },
      
      // Roles & Permissions management
      { key: 'roles.view', label: 'View Roles', group: 'rbac', created_at: new Date(), updated_at: new Date() },
      { key: 'roles.edit', label: 'Edit Roles', group: 'rbac', created_at: new Date(), updated_at: new Date() },
      { key: 'permissions.view', label: 'View Permissions', group: 'rbac', created_at: new Date(), updated_at: new Date() },
      { key: 'roles.assign', label: 'Assign Roles to Users', group: 'rbac', created_at: new Date(), updated_at: new Date() }
    ];

    await queryInterface.bulkInsert('permissions', permissions, { ignoreDuplicates: true });

    // Get role and permission IDs for mapping
    const [rolesData] = await queryInterface.sequelize.query(
      'SELECT id, `key` FROM roles'
    );
    const [permsData] = await queryInterface.sequelize.query(
      'SELECT id, `key` FROM permissions'
    );

    const roleMap = {};
    rolesData.forEach(r => { roleMap[r.key] = r.id; });
    
    const permMap = {};
    permsData.forEach(p => { permMap[p.key] = p.id; });

    // Map super_admin to all permissions (mode=all, allow=1)
    const superAdminPerms = [];
    for (const permKey in permMap) {
      superAdminPerms.push({
        role_id: roleMap['super_admin'],
        permission_id: permMap[permKey],
        mode: 'all',
        allow: 1,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Map admin to most permissions (except role/permission management)
    const adminPermKeys = [
      'users.view', 'users.edit', 'users.create', 'users.ban',
      'transactions.view', 'transactions.approve', 'transactions.reject', 'transactions.adjust', 'transactions.create',
      'orders.view', 'orders.edit', 'orders.refund', 'orders.cancel',
      'tasks.view', 'tasks.review', 'tasks.approve', 'tasks.reject',
      'settings.view', 'settings.edit',
      'audit_logs.view', 'action_logs.view'
    ];
    const adminPerms = adminPermKeys.map(key => ({
      role_id: roleMap['admin'],
      permission_id: permMap[key],
      mode: 'all',
      allow: 1,
      created_at: new Date(),
      updated_at: new Date()
    }));

    // Map moderator to view-only permissions
    const moderatorPermKeys = [
      'users.view',
      'transactions.view',
      'orders.view',
      'tasks.view', 'tasks.review',
      'audit_logs.view', 'action_logs.view'
    ];
    const moderatorPerms = moderatorPermKeys.map(key => ({
      role_id: roleMap['moderator'],
      permission_id: permMap[key],
      mode: 'all',
      allow: 1,
      created_at: new Date(),
      updated_at: new Date()
    }));

    // Task givers and task doers get no admin permissions by default

    const allRolePermissions = [
      ...superAdminPerms,
      ...adminPerms,
      ...moderatorPerms
    ];

    await queryInterface.bulkInsert('role_permissions', allRolePermissions, { ignoreDuplicates: true });

    // Insert default system settings
    const defaultSettings = [
      {
        key: 'features.transactions',
        value: JSON.stringify({ approveEnabled: true, rejectEnabled: true, adjustmentsEnabled: true }),
        description: 'Transaction feature flags',
        updated_at: new Date(),
        created_at: new Date()
      },
      {
        key: 'features.users',
        value: JSON.stringify({ editEnabled: true, deleteEnabled: false, banEnabled: true }),
        description: 'User management feature flags',
        updated_at: new Date(),
        created_at: new Date()
      },
      {
        key: 'features.orders',
        value: JSON.stringify({ editEnabled: true, refundEnabled: true, cancelEnabled: true }),
        description: 'Order management feature flags',
        updated_at: new Date(),
        created_at: new Date()
      },
      {
        key: 'features.tasks',
        value: JSON.stringify({ reviewEnabled: true, approveEnabled: true, rejectEnabled: true }),
        description: 'Task management feature flags',
        updated_at: new Date(),
        created_at: new Date()
      },
      {
        key: 'limits',
        value: JSON.stringify({ maxUsersPageSize: 100, maxTransactionsPageSize: 100, maxOrdersPageSize: 100, maxTasksPageSize: 100 }),
        description: 'Pagination limits',
        updated_at: new Date(),
        created_at: new Date()
      },
      {
        key: 'modes',
        value: JSON.stringify({ taskDoer: { allowed: true }, taskGiver: { allowed: true } }),
        description: 'User mode configuration',
        updated_at: new Date(),
        created_at: new Date()
      },
      {
        key: 'security',
        value: JSON.stringify({ enforce2FA: false, lockOnFailedLogins: true, captchaOnSignup: false, maxLoginAttempts: 5, lockoutDuration: 30 }),
        description: 'Security settings',
        updated_at: new Date(),
        created_at: new Date()
      },
      {
        key: 'general',
        value: JSON.stringify({ 
          siteName: 'Social Developer Platform', 
          maintenanceMode: false, 
          registrationEnabled: true, 
          emailNotifications: true,
          taskAutoApproval: false,
          maxTasksPerUser: 100,
          minWithdrawalAmount: 10,
          withdrawalFee: 0.05,
          currencies: ['USD', 'EUR', 'GBP'],
          supportedPlatforms: ['instagram', 'youtube', 'twitter', 'tiktok'],
          taskApprovalTimeoutHours: 24,
          orderTimeoutHours: 72
        }),
        description: 'General system settings',
        updated_at: new Date(),
        created_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('system_settings', defaultSettings, { ignoreDuplicates: true });
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('role_permissions', null, {});
    await queryInterface.bulkDelete('user_roles', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
    await queryInterface.bulkDelete('roles', null, {});
    await queryInterface.bulkDelete('system_settings', null, {});
  }
};
