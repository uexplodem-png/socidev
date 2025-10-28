'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      actor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      actor_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      actor_email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      resource: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      resource_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      target_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      target_user_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      user_agent: {
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

    await queryInterface.addIndex('audit_logs', ['actor_id', 'created_at']);
    await queryInterface.addIndex('audit_logs', ['resource', 'resource_id']);
    await queryInterface.addIndex('audit_logs', ['target_user_id']);
    await queryInterface.addIndex('audit_logs', ['created_at']);
    await queryInterface.addIndex('audit_logs', ['action']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('audit_logs');
  }
};