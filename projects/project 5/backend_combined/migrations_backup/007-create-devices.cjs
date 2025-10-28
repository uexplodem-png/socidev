'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('devices', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      device_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      device_type: {
        type: Sequelize.ENUM('mobile', 'desktop', 'tablet', 'server'),
        allowNull: false,
      },
      browser: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      platform: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'banned', 'maintenance'),
        defaultValue: 'active',
      },
      last_active: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      tasks_completed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      device_fingerprint: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      screen_resolution: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      timezone: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      configuration: {
        type: Sequelize.JSON,
        defaultValue: {},
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
    await queryInterface.addIndex('devices', ['user_id']);
    await queryInterface.addIndex('devices', ['status']);
    await queryInterface.addIndex('devices', ['device_type']);
    await queryInterface.addIndex('devices', ['last_active']);
    await queryInterface.addIndex('devices', ['device_fingerprint']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('devices');
  }
};