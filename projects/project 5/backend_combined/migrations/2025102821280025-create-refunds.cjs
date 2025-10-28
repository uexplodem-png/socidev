'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('refunds', {
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
      transaction_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'transactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'completed'),
        defaultValue: 'pending'
      },
      processed_at: {
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

    await queryInterface.addIndex('refunds', ['user_id']);
    await queryInterface.addIndex('refunds', ['transaction_id']);
    await queryInterface.addIndex('refunds', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('refunds');
  }
};