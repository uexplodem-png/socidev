import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import User from "./User.js";

const InstagramAccount = sequelize.define(
  "InstagramAccount",
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
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "limited"),
      defaultValue: "active",
    },
    totalFollowed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "total_followed",
    },
    totalLikes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "total_likes",
    },
    totalComments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "total_comments",
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
      field: "total_earnings",
    },
    lastActivity: {
      type: DataTypes.DATE,
      field: "last_activity",
    },
    settings: {
      type: DataTypes.JSON,
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
  },
  {
    tableName: "instagram_accounts",
    underscored: true,
  }
);

InstagramAccount.belongsTo(User, { foreignKey: "userId" });
User.hasMany(InstagramAccount, { foreignKey: "userId" });

export default InstagramAccount;
