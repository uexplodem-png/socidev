'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payment_gateways', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      provider: {
        type: Sequelize.ENUM('stripe', 'paypal', 'crypto'),
        allowNull: false
      },
      transaction_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'USD'
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {}
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

    await queryInterface.addIndex('payment_gateways', ['transaction_id']);
    await queryInterface.addIndex('payment_gateways', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payment_gateways');
  }
};