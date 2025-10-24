'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('services', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      platform_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'platforms',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      price_per_unit: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      min_order: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      max_order: {
        type: Sequelize.INTEGER,
        defaultValue: 10000,
        allowNull: false,
      },
      input_field_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      sample_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      features: {
        type: Sequelize.JSON,
        defaultValue: [],
        allowNull: true,
      },
      commission_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 10,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for faster queries
    await queryInterface.addIndex('services', ['platform_id']);
    await queryInterface.addIndex('services', ['name']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('services');
  },
};
