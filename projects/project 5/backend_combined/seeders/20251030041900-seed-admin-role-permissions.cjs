'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Define all admin panel permissions
    const permissions = {
      // User Management
      'users.view': { superAdmin: true, admin: true, moderator: true },
      'users.create': { superAdmin: true, admin: true, moderator: false },
      'users.edit': { superAdmin: true, admin: true, moderator: false },
      'users.suspend': { superAdmin: true, admin: true, moderator: true },
      'users.ban': { superAdmin: true, admin: true, moderator: false },
      'balance.adjust': { superAdmin: true, admin: true, moderator: false },

      // Financial Operations
      'transactions.view': { superAdmin: true, admin: true, moderator: true },
      'transactions.approve': { superAdmin: true, admin: true, moderator: false },
      'transactions.reject': { superAdmin: true, admin: true, moderator: false },
      'withdrawals.view': { superAdmin: true, admin: true, moderator: true },
      'withdrawals.approve': { superAdmin: true, admin: true, moderator: false },
      'withdrawals.reject': { superAdmin: true, admin: true, moderator: false },

      // Task Management
      'tasks.view': { superAdmin: true, admin: true, moderator: true },
      'tasks.edit': { superAdmin: true, admin: true, moderator: false },
      'tasks.approve': { superAdmin: true, admin: true, moderator: true },
      'tasks.reject': { superAdmin: true, admin: true, moderator: true },
      'tasks.delete': { superAdmin: true, admin: true, moderator: false },

      // Order Management
      'orders.view': { superAdmin: true, admin: true, moderator: true },
      'orders.edit': { superAdmin: true, admin: true, moderator: false },
      'orders.cancel': { superAdmin: true, admin: true, moderator: true },
      'orders.refund': { superAdmin: true, admin: true, moderator: false },

      // Content Management
      'social_accounts.view': { superAdmin: true, admin: true, moderator: true },
      'devices.view': { superAdmin: true, admin: true, moderator: true },
      'devices.ban': { superAdmin: true, admin: true, moderator: false },
      'platforms.view': { superAdmin: true, admin: true, moderator: true },
      'platforms.edit': { superAdmin: true, admin: true, moderator: false },
      'services.view': { superAdmin: true, admin: true, moderator: true },
      'services.edit': { superAdmin: true, admin: true, moderator: false },

      // System Management
      'audit.view': { superAdmin: true, admin: true, moderator: true },
      'settings.view': { superAdmin: true, admin: true, moderator: true },
      'settings.edit': { superAdmin: true, admin: true, moderator: false },
      'roles.view': { superAdmin: true, admin: true, moderator: false },
      'roles.manage': { superAdmin: true, admin: false, moderator: false },
      'permissions.view': { superAdmin: true, admin: true, moderator: false },

      // Email Management
      'emails.view': { superAdmin: true, admin: true, moderator: true },
      'emails.create': { superAdmin: true, admin: true, moderator: false },
      'emails.edit': { superAdmin: true, admin: true, moderator: false },
      'emails.delete': { superAdmin: true, admin: false, moderator: false },
      'emails.send': { superAdmin: true, admin: true, moderator: true },
      'emails.send_bulk': { superAdmin: true, admin: true, moderator: false },
    };

    const records = [];
    const roles = ['super_admin', 'admin', 'moderator'];

    // Create records for each role and permission combination
    for (const [permissionKey, allowances] of Object.entries(permissions)) {
      for (const role of roles) {
        const roleKey = role === 'super_admin' ? 'superAdmin' : role;
        records.push({
          id: uuidv4(),
          role: role,
          permission_key: permissionKey,
          allow: allowances[roleKey] || false,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }

    await queryInterface.bulkInsert('admin_role_permissions', records, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('admin_role_permissions', null, {});
  },
};
