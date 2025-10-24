import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import User from "./User.js";
import bcrypt from "bcryptjs";

// Instagram Account Model
export const InstagramAccount = sequelize.define(
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
    totalFollowers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "total_followers",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
  },
  {
    tableName: "instagram_accounts",
    underscored: true,
    hooks: {
      beforeSave: async (account) => {
        if (account.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          account.password = await bcrypt.hash(account.password, salt);
        }
      },
    },
  }
);

// Follow Task Model
export const FollowTask = sequelize.define(
  "FollowTask",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    targetAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: InstagramAccount,
        key: "id",
      },
      field: "target_account_id",
    },
    followerAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: InstagramAccount,
        key: "id",
      },
      field: "follower_account_id",
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "failed"),
      defaultValue: "pending",
    },
    completedAt: {
      type: DataTypes.DATE,
      field: "completed_at",
    },
  },
  {
    tableName: "follow_tasks",
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["target_account_id", "follower_account_id"],
        name: "follow_tasks_unique_follow",
      },
    ],
  }
);

// Account Statistics Model
export const AccountStatistics = sequelize.define(
  "AccountStatistics",
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
    followedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "followed_count",
    },
    likedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "liked_count",
    },
    savedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "saved_count",
    },
    commentedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "commented_count",
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
      field: "total_earnings",
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "last_updated",
    },
  },
  {
    tableName: "account_statistics",
    underscored: true,
  }
);

// Set up associations
InstagramAccount.belongsTo(User, { foreignKey: "userId" });
User.hasMany(InstagramAccount, { foreignKey: "userId" });

FollowTask.belongsTo(InstagramAccount, {
  as: "targetAccount",
  foreignKey: "targetAccountId",
});
FollowTask.belongsTo(InstagramAccount, {
  as: "followerAccount",
  foreignKey: "followerAccountId",
});

InstagramAccount.hasMany(FollowTask, {
  as: "targetTasks",
  foreignKey: "targetAccountId",
});
InstagramAccount.hasMany(FollowTask, {
  as: "followerTasks",
  foreignKey: "followerAccountId",
});

InstagramAccount.hasOne(AccountStatistics, { foreignKey: "accountId" });
AccountStatistics.belongsTo(InstagramAccount, { foreignKey: "accountId" });

// Export models
export default InstagramAccount;