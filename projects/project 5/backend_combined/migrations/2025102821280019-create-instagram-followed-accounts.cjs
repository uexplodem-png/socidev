'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('instagram_followed_accounts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'instagram_accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      target_username: {
        type: Sequelize.STRING,
        allowNull: false
      },
      followed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      task_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      earnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0
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

    await queryInterface.addIndex('instagram_followed_accounts', ['account_id', 'target_username'], {
      unique: true,
      name: 'instagram_followed_accounts_unique_follow'
    });
    await queryInterface.addIndex('instagram_followed_accounts', ['followed_at']);
    await queryInterface.addIndex('instagram_followed_accounts', ['task_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('instagram_followed_accounts');
  }
};