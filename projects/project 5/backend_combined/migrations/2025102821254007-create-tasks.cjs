'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tasks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('like', 'follow', 'view', 'subscribe', 'comment', 'share'),
        allowNull: false
      },
      platform: {
        type: Sequelize.ENUM('instagram', 'youtube', 'twitter', 'tiktok'),
        allowNull: false
      },
      target_url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      remaining_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      completed_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      rate: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'processing', 'submitted_for_approval', 'completed', 'failed', 'cancelled', 'rejected_by_admin'),
        defaultValue: 'pending'
      },
      admin_status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      screenshot_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      screenshot_thumbnail_url: {
        type: Sequelize.STRING(500),
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
      payout_processed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      admin_reviewed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      admin_reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejection_reason: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      requirements: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      last_updated_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('tasks', ['user_id']);
    await queryInterface.addIndex('tasks', ['order_id']);
    await queryInterface.addIndex('tasks', ['platform', 'type']);
    await queryInterface.addIndex('tasks', ['status']);
    await queryInterface.addIndex('tasks', ['admin_status']);
    await queryInterface.addIndex('tasks', ['last_updated_at']);
    await queryInterface.addIndex('tasks', ['priority']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tasks');
  }
};