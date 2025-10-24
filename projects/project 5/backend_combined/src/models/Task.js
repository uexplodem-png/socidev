import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import User from "./User.js";

const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      field: "user_id",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("like", "follow", "view", "subscribe", "comment", "share"),
      allowNull: false,
    },
    platform: {
      type: DataTypes.ENUM("instagram", "youtube", "twitter", "tiktok"),
      allowNull: false,
    },
    targetUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "target_url",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    remainingQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "remaining_quantity",
    },
    completedQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "completed_quantity",
    },
    rate: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "processing", "completed", "failed", "cancelled"),
      defaultValue: "pending",
    },
    adminStatus: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
      field: "admin_status",
    },
    adminReviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: "id",
      },
      field: "admin_reviewed_by",
    },
    adminReviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "admin_reviewed_at",
    },
    rejectionReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "rejection_reason",
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "urgent"),
      defaultValue: "medium",
    },
    requirements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastUpdatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "last_updated_at",
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "started_at",
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "completed_at",
    },
  },
  {
    tableName: "tasks",
    underscored: true,
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["platform", "type"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["admin_status"],
      },
      {
        fields: ["last_updated_at"],
      },
      {
        fields: ["priority"],
      },
    ],
  }
);

Task.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Task, { foreignKey: "userId" });

export default Task;