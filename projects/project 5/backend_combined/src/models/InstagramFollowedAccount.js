import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import InstagramAccount from "./InstagramAccount.js";
import Task from "./Task.js";

const InstagramFollowedAccount = sequelize.define(
  "InstagramFollowedAccount",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: InstagramAccount,
        key: "id",
      },
      field: "account_id",
    },
    targetUsername: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "target_username",
    },
    followedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "followed_at",
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Task,
        key: "id",
      },
      field: "task_id",
    },
    earnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
  },
  {
    tableName: "instagram_followed_accounts",
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["account_id", "target_username"],
        name: "instagram_followed_accounts_unique_follow",
      },
      {
        fields: ["followed_at"],
        name: "instagram_followed_accounts_followed_at",
      },
      {
        fields: ["task_id"],
        name: "instagram_followed_accounts_task_id",
      },
    ],
  }
);

// Set up associations
InstagramFollowedAccount.belongsTo(InstagramAccount, {
  foreignKey: "accountId",
});
InstagramAccount.hasMany(InstagramFollowedAccount, { foreignKey: "accountId" });

InstagramFollowedAccount.belongsTo(Task, { foreignKey: "taskId" });
Task.hasMany(InstagramFollowedAccount, { foreignKey: "taskId" });

export default InstagramFollowedAccount;
