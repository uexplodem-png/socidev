'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('order_statistics', {
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
        type: Sequelize.ENUM('instagram', 'youtube'),
        allowNull: true
      },
      timeframe: {
        type: Sequelize.ENUM('7d', '30d', '90d', '1y'),
        allowNull: false,
        defaultValue: '30d'
      },
      active_orders: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      completed_orders: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_orders: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_spent: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0
      },
      active_orders_growth: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      completed_orders_growth: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      total_orders_growth: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      total_spent_growth: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      last_calculated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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

    await queryInterface.addIndex('order_statistics', ['user_id', 'platform', 'timeframe'], {
      unique: true,
      name: 'order_statistics_unique_user_platform_timeframe'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('order_statistics');
  }
};