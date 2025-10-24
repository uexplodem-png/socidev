"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Ensure referenced tables exist before creating this table
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0;");

    await queryInterface.createTable("task_executions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: "users" }, // Explicitly set table name
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: "tasks" }, // Explicitly set table name
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM("pending", "completed", "failed"),
        defaultValue: "pending",
      },
      executed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      completed_at: {
        type: Sequelize.DATE,
      },
      cooldown_ends_at: {
        type: Sequelize.DATE,
      },
      earnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      proof: {
        type: Sequelize.JSON,
        defaultValue: {},
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

    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1;");

    // Add indexes
    await queryInterface.addIndex("task_executions", ["user_id", "task_id"], {
      unique: true,
      name: "task_executions_user_task_unique",
    });

    await queryInterface.addIndex("task_executions", ["executed_at"], {
      name: "task_executions_executed_at",
    });

    await queryInterface.addIndex("task_executions", ["cooldown_ends_at"], {
      name: "task_executions_cooldown_ends_at",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("task_executions");
  },
};
