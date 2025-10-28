'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('desktop_api_keys', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Friendly name for the API key'
      },
      api_key: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
        comment: 'SHA256 hashed API key'
      },
      api_secret: {
        type: Sequelize.STRING(128),
        allowNull: false,
        comment: 'Encrypted API secret for request signing'
      },
      permissions: {
        type: Sequelize.JSON,
        defaultValue: {
          getTasks: true,
          getTaskDetails: true,
          getInProgressTasks: true,
          completeTask: true,
          uploadScreenshot: true
        }
      },
      rate_limit: {
        type: Sequelize.INTEGER,
        defaultValue: 1000,
        comment: 'Requests per hour'
      },
      ip_whitelist: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      last_used_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_used_ip: {
        type: Sequelize.STRING,
        allowNull: true
      },
      request_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'revoked'),
        defaultValue: 'active'
      },
      expires_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('desktop_api_keys', ['user_id']);
    await queryInterface.addIndex('desktop_api_keys', ['api_key']);
    await queryInterface.addIndex('desktop_api_keys', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('desktop_api_keys');
  }
};