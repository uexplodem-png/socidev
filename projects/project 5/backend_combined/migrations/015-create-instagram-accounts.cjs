"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("instagram_accounts", {
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
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("active", "inactive", "limited"),
        defaultValue: "active",
      },
      total_followed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total_likes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total_comments: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total_earnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      last_activity: {
        type: Sequelize.DATE,
      },
      settings: {
        type: Sequelize.JSON,
        defaultValue: {
          autoRenew: true,
          maxDailyTasks: 10,
          notifications: {
            email: true,
            browser: true,
          },
          privacy: {
            hideStats: false,
            privateProfile: false,
          },
        },
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

    // Add indexes
    await queryInterface.addIndex("instagram_accounts", ["username"], {
      unique: true,
      name: "instagram_accounts_username_unique",
    });

    await queryInterface.addIndex("instagram_accounts", ["user_id"], {
      name: "instagram_accounts_user_id",
    });

    await queryInterface.addIndex("instagram_accounts", ["status"], {
      name: "instagram_accounts_status",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("instagram_accounts");
  },
};
