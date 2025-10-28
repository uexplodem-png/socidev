'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('system_settings', {
      key: {
        type: Sequelize.STRING(100),
        primaryKey: true,
        allowNull: false,
        unique: true
      },
      value: {
        type: Sequelize.JSON,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      updated_by: {
        type: Sequelize.STRING(36),
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

    await queryInterface.addIndex('system_settings', ['key']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('system_settings');
  }
};