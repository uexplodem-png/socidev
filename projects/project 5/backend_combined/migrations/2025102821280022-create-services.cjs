'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('services', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      platform_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'platforms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
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
      price_per_unit: {
        type: Sequelize.DECIMAL(10, 5),
        allowNull: false
      },
      min_order: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      max_order: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      input_field_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      sample_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      features: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      features_en: {
        type: Sequelize.JSON,
        allowNull: true
      },
      features_tr: {
        type: Sequelize.JSON,
        allowNull: true
      },
      url_pattern: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      url_label: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      commission_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0
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

    await queryInterface.addIndex('services', ['platform_id']);
    await queryInterface.addIndex('services', ['is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('services');
  }
};