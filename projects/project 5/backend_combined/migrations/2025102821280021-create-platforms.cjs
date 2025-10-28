'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('platforms', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      name_en: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      name_tr: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      description_en: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      description_tr: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      icon: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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

    await queryInterface.addIndex('platforms', ['name']);
    await queryInterface.addIndex('platforms', ['is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('platforms');
  }
};