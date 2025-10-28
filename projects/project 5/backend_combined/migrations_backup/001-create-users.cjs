'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      phone: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      balance: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
      },
      role: {
        type: Sequelize.ENUM('user', 'admin', 'super_admin'),
        defaultValue: 'user',
      },
      user_mode: {
        type: Sequelize.ENUM('taskDoer', 'taskGiver'),
        defaultValue: 'taskDoer',
      },
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'banned'),
        defaultValue: 'active',
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      avatar: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};