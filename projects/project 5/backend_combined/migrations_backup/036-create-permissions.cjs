'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      label: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      group: {
        type: Sequelize.STRING(100),
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

    await queryInterface.addIndex('permissions', ['key'], {
      name: 'idx_permissions_key',
      unique: true
    });

    await queryInterface.addIndex('permissions', ['group'], {
      name: 'idx_permissions_group'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('permissions');
  }
};
