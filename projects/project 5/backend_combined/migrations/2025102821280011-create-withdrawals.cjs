'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('withdrawals', {
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
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      method: {
        type: Sequelize.ENUM('bank_transfer', 'crypto', 'paypal'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
        defaultValue: 'pending'
      },
      details: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
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
      transaction_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      rejection_reason: {
        type: Sequelize.STRING(500),
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

    await queryInterface.addIndex('withdrawals', ['user_id']);
    await queryInterface.addIndex('withdrawals', ['status']);
    await queryInterface.addIndex('withdrawals', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('withdrawals');
  }
};