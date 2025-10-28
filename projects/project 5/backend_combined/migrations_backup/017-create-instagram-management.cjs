"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Ensure referenced tables exist before creating this table
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0;");

    await queryInterface.createTable("instagram_followed_accounts", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: "instagram_accounts" },
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      target_username: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      followed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      task_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: "tasks" },
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      earnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0,
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

    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1;");

    // Add indexes
    await queryInterface.addIndex(
      "instagram_followed_accounts",
      ["followed_at"],
      {
        name: "idx_instagram_followed_managment_date",
      }
    );

    await queryInterface.addIndex("instagram_followed_accounts", ["task_id"], {
      name: "idx_instagram_followed_managment_task",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("instagram_followed_accounts");
  },
};
