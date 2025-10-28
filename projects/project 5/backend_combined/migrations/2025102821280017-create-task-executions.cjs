'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('task_executions', {
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
      task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending'
      },
      executed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cooldown_ends_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      earnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0
      },
      proof: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      screenshot_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      screenshot_status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: true
      },
      screenshot_submitted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejection_reason: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('task_executions', ['user_id', 'task_id'], {
      unique: true,
      name: 'task_executions_user_task_unique'
    });
    await queryInterface.addIndex('task_executions', ['executed_at']);
    await queryInterface.addIndex('task_executions', ['cooldown_ends_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('task_executions');
  }
};