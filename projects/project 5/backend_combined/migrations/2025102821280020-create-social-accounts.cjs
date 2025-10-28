'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('social_accounts', {
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
      platform: {
        type: Sequelize.ENUM('instagram', 'youtube', 'twitter', 'tiktok'),
        allowNull: false
      },
      username: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      account_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      profile_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'error', 'suspended', 'banned'),
        defaultValue: 'active'
      },
      followers_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      following_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      posts_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_activity: {
        type: Sequelize.DATE,
        allowNull: true
      },
      health_score: {
        type: Sequelize.INTEGER,
        defaultValue: 100
      },
      verification_status: {
        type: Sequelize.ENUM('pending', 'verified', 'failed'),
        defaultValue: 'pending'
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      token_expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      account_data: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      error_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      last_error_at: {
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

    await queryInterface.addIndex('social_accounts', ['user_id']);
    await queryInterface.addIndex('social_accounts', ['platform']);
    await queryInterface.addIndex('social_accounts', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('social_accounts');
  }
};