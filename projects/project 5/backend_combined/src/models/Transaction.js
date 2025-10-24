import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import User from "./User.js";
import Order from "./Order.js";

const Transaction = sequelize.define(
  "Transaction",
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
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Order,
        key: "id",
      },
      field: "order_id",
    },
    type: {
      type: DataTypes.ENUM(
        "deposit",
        "withdrawal",
        "order_payment",
        "task_earning",
        "adjustment"
      ),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "failed"),
      defaultValue: "pending",
    },
    method: {
      type: DataTypes.ENUM("bank_transfer", "credit_card", "crypto", "balance"),
      allowNull: false,
    },
    details: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    balance_before: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    balance_after: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    processed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    tableName: "transactions",
    underscored: true,
  }
);

Transaction.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Transaction, { foreignKey: "userId" });

Transaction.belongsTo(Order, { foreignKey: "orderId" });
Order.hasOne(Transaction, { foreignKey: "orderId" });

Transaction.belongsTo(User, { foreignKey: "processed_by" });

export default Transaction;

export { Transaction };
