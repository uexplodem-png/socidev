'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      balance: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      role: {
        type: Sequelize.ENUM('task_doer', 'task_giver', 'admin', 'super_admin', 'moderator'),
        defaultValue: 'task_doer'
      },
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'banned', 'pending'),
        defaultValue: 'active'
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      avatar: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      two_factor_secret: {
        type: Sequelize.STRING,
        allowNull: true
      },
      two_factor_backup_codes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      email_verification_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email_verification_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      password_reset_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      password_reset_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      locked_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      user_mode: {
        type: Sequelize.ENUM('task_doer', 'task_giver', 'both'),
        defaultValue: 'task_doer'
      },
      refresh_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};