'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
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
      user_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      user_email: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      platform: {
        type: Sequelize.ENUM('instagram', 'youtube', 'twitter', 'tiktok'),
        allowNull: false,
      },
      service: {
        type: Sequelize.STRING(255),
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
      start_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      remaining_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      completed_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
        defaultValue: 'pending',
      },
      speed: {
        type: Sequelize.ENUM('normal', 'fast', 'express'),
        defaultValue: 'normal',
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      progress: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    await queryInterface.addIndex('orders', ['user_id']);
    await queryInterface.addIndex('orders', ['platform']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['created_at']);
    await queryInterface.addIndex('orders', ['platform', 'service']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
  }
};