"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("activity_logs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      details: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      ip_address: {
        type: Sequelize.STRING,
      },
      user_agent: {
        type: Sequelize.STRING,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("activity_logs");
  },
};
