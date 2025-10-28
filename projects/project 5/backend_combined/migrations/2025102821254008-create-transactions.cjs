'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transactions', {
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
      type: {
        type: Sequelize.ENUM('deposit', 'withdrawal', 'order_payment', 'task_earning', 'adjustment'),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending'
      },
      method: {
        type: Sequelize.ENUM('bank_transfer', 'credit_card', 'crypto', 'balance'),
        allowNull: false
      },
      details: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      reference: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      balance_before: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      balance_after: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      processed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    await queryInterface.addIndex('transactions', ['user_id']);
    await queryInterface.addIndex('transactions', ['order_id']);
    await queryInterface.addIndex('transactions', ['type']);
    await queryInterface.addIndex('transactions', ['status']);
    await queryInterface.addIndex('transactions', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('transactions');
  }
};