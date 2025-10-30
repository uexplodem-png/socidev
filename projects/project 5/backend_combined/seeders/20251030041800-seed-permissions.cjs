'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const permissions = [
      // User Management
      { key: 'users.view', label: 'View Users', group: 'users' },
      { key: 'users.create', label: 'Create Users', group: 'users' },
      { key: 'users.edit', label: 'Edit Users', group: 'users' },
      { key: 'users.suspend', label: 'Suspend Users', group: 'users' },
      { key: 'users.ban', label: 'Ban Users', group: 'users' },
      { key: 'balance.adjust', label: 'Adjust User Balance', group: 'users' },

      // Financial Operations
      { key: 'transactions.view', label: 'View Transactions', group: 'finance' },
      { key: 'transactions.approve', label: 'Approve Transactions', group: 'finance' },
      { key: 'transactions.reject', label: 'Reject Transactions', group: 'finance' },
      { key: 'withdrawals.view', label: 'View Withdrawals', group: 'finance' },
      { key: 'withdrawals.approve', label: 'Approve Withdrawals', group: 'finance' },
      { key: 'withdrawals.reject', label: 'Reject Withdrawals', group: 'finance' },

      // Task Management
      { key: 'tasks.view', label: 'View Tasks', group: 'tasks' },
      { key: 'tasks.edit', label: 'Edit Tasks', group: 'tasks' },
      { key: 'tasks.approve', label: 'Approve Tasks', group: 'tasks' },
      { key: 'tasks.reject', label: 'Reject Tasks', group: 'tasks' },
      { key: 'tasks.delete', label: 'Delete Tasks', group: 'tasks' },

      // Order Management
      { key: 'orders.view', label: 'View Orders', group: 'orders' },
      { key: 'orders.edit', label: 'Edit Orders', group: 'orders' },
      { key: 'orders.cancel', label: 'Cancel Orders', group: 'orders' },
      { key: 'orders.refund', label: 'Refund Orders', group: 'orders' },

      // Content Management
      { key: 'social_accounts.view', label: 'View Social Accounts', group: 'content' },
      { key: 'devices.view', label: 'View Devices', group: 'content' },
      { key: 'devices.ban', label: 'Ban Devices', group: 'content' },
      { key: 'platforms.view', label: 'View Platforms', group: 'content' },
      { key: 'platforms.edit', label: 'Edit Platforms', group: 'content' },
      { key: 'services.view', label: 'View Services', group: 'content' },
      { key: 'services.edit', label: 'Edit Services', group: 'content' },

      // System Management
      { key: 'audit.view', label: 'View Audit Logs', group: 'system' },
      { key: 'settings.view', label: 'View Settings', group: 'system' },
      { key: 'settings.edit', label: 'Edit Settings', group: 'system' },
      { key: 'roles.view', label: 'View Roles', group: 'rbac' },
      { key: 'roles.manage', label: 'Manage Roles', group: 'rbac' },
      { key: 'permissions.view', label: 'View Permissions', group: 'rbac' },

      // Analytics & Dashboard
      { key: 'analytics.view', label: 'View Analytics', group: 'analytics' },
      { key: 'dashboard.view', label: 'View Dashboard', group: 'analytics' },

      // Email Management
      { key: 'emails.view', label: 'View Emails', group: 'emails' },
      { key: 'emails.create', label: 'Create Email Templates', group: 'emails' },
      { key: 'emails.edit', label: 'Edit Email Templates', group: 'emails' },
      { key: 'emails.delete', label: 'Delete Email Templates', group: 'emails' },
      { key: 'emails.send', label: 'Send Emails', group: 'emails' },
      { key: 'emails.send_bulk', label: 'Send Bulk Emails', group: 'emails' },

      // API Management
      { key: 'api.view', label: 'View API Keys', group: 'api' },
      { key: 'api.edit', label: 'Edit API Keys', group: 'api' },
      { key: 'api.delete', label: 'Delete API Keys', group: 'api' },
    ];

    const records = permissions.map(perm => ({
      ...perm,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await queryInterface.bulkInsert('permissions', records, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('permissions', null, {});
  },
};
