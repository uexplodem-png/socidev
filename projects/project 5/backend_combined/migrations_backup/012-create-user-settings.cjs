"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_settings", {
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
      notifications: {
        type: Sequelize.JSON,
        defaultValue: {
          email: true,
          browser: true,
        },
      },
      privacy: {
        type: Sequelize.JSON,
        defaultValue: {
          hideProfile: false,
          hideStats: false,
        },
      },
      language: {
        type: Sequelize.ENUM("en", "tr"),
        defaultValue: "en",
      },
      theme: {
        type: Sequelize.ENUM("light", "dark", "system"),
        defaultValue: "system",
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
    await queryInterface.dropTable("user_settings");
  },
};
