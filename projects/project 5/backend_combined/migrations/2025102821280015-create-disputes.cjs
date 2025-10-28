'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('disputes', {
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
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('order_issue', 'payment_issue', 'technical_issue', 'other'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('open', 'under_review', 'resolved', 'closed'),
        defaultValue: 'open'
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      resolution: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      resolved_at: {
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

    await queryInterface.addIndex('disputes', ['user_id']);
    await queryInterface.addIndex('disputes', ['order_id']);
    await queryInterface.addIndex('disputes', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('disputes');
  }
};