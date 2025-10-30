'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_role_permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('super_admin', 'admin', 'moderator'),
        allowNull: false,
        comment: 'Admin role: super_admin, admin, or moderator',
      },
      permission_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Permission key (e.g., users.edit, balance.adjust, withdrawals.approve)',
      },
      allow: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this role has this permission',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes for faster lookups
    await queryInterface.addIndex('admin_role_permissions', ['role', 'permission_key'], {
      unique: true,
      name: 'idx_admin_role_permission_unique',
    });

    await queryInterface.addIndex('admin_role_permissions', ['role'], {
      name: 'idx_admin_role',
    });

    await queryInterface.addIndex('admin_role_permissions', ['permission_key'], {
      name: 'idx_permission_key',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('admin_role_permissions');
  },
};
