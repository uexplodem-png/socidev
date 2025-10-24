import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import User from "./User.js";

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false, // Keep this as false to match the migration
      references: {
        model: User,
        key: "id",
      },
      field: "user_id",
    },
    platform: {
      type: DataTypes.ENUM("instagram", "youtube", "twitter", "tiktok"), // Add missing platforms
      allowNull: false,
    },
    service: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    targetUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "target_url",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    startCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "start_count",
    },
    remainingCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "remaining_count",
    },
    completedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "completed_count",
    },
    status: {
      type: DataTypes.ENUM("pending", "processing", "completed", "failed", "cancelled", "refunded"), // Add missing statuses
      defaultValue: "pending",
    },
    speed: {
      type: DataTypes.ENUM("normal", "fast", "express"),
      defaultValue: "normal",
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: "orders",
    underscored: true,
  }
);

// Instance method to check if order can be refunded
Order.prototype.canBeRefunded = function() {
  // Orders can be refunded if they're in pending, processing, or completed status
  // but not if already refunded, failed, or cancelled
  const refundableStatuses = ['pending', 'processing', 'completed'];
  return refundableStatuses.includes(this.status);
};

// Remove the duplicate association definition here since it's handled in models/index.js

export default Order;