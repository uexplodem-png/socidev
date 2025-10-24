import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import User from "./User.js";

const OrderStatistics = sequelize.define(
  "OrderStatistics",
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
    platform: {
      type: DataTypes.ENUM("instagram", "youtube"),
      allowNull: true,
    },
    timeframe: {
      type: DataTypes.ENUM("7d", "30d", "90d", "1y"),
      allowNull: false,
      defaultValue: "30d",
    },
    activeOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "active_orders",
    },
    completedOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "completed_orders",
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "total_orders",
    },
    totalSpent: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
      field: "total_spent",
    },
    activeOrdersGrowth: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: "active_orders_growth",
    },
    completedOrdersGrowth: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: "completed_orders_growth",
    },
    totalOrdersGrowth: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: "total_orders_growth",
    },
    totalSpentGrowth: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: "total_spent_growth",
    },
    lastCalculatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "last_calculated_at",
    },
  },
  {
    tableName: "order_statistics",
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "platform", "timeframe"],
        name: "order_statistics_unique_user_platform_timeframe",
      },
    ],
  }
);

OrderStatistics.belongsTo(User, { foreignKey: "userId" });
User.hasMany(OrderStatistics, { foreignKey: "userId" });

export default OrderStatistics;
