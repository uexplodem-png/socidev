'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tasks', {
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
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM('like', 'follow', 'view', 'subscribe', 'comment', 'share'),
        allowNull: false,
      },
      platform: {
        type: Sequelize.ENUM('instagram', 'youtube', 'twitter', 'tiktok'),
        allowNull: false,
      },
      target_url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      remaining_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      completed_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      rate: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
        defaultValue: 'pending',
      },
      admin_status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
      },
      admin_reviewed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      admin_reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rejection_reason: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
      },
      requirements: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      last_updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completed_at: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('tasks', ['user_id']);
    await queryInterface.addIndex('tasks', ['platform', 'type']);
    await queryInterface.addIndex('tasks', ['status']);
    await queryInterface.addIndex('tasks', ['admin_status']);
    await queryInterface.addIndex('tasks', ['last_updated_at']);
    await queryInterface.addIndex('tasks', ['priority']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tasks');
  }
};