'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('instagram_accounts', {
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
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'limited'),
        defaultValue: 'active'
      },
      total_followed: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_likes: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_comments: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_earnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0
      },
      last_activity: {
        type: Sequelize.DATE,
        allowNull: true
      },
      settings: {
        type: Sequelize.JSON,
        defaultValue: {
          autoRenew: true,
          maxDailyTasks: 10,
          notifications: { email: true, browser: true },
          privacy: { hideStats: false, privateProfile: false }
        }
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

    await queryInterface.addIndex('instagram_accounts', ['user_id']);
    await queryInterface.addIndex('instagram_accounts', ['username']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('instagram_accounts');
  }
};