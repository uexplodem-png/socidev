import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import User from "./User.js";
import Task from "./Task.js";

const TaskExecution = sequelize.define(
  "TaskExecution",
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
    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Task,
        key: "id",
      },
      field: "task_id",
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "failed"),
      defaultValue: "pending",
    },
    executedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "executed_at",
    },
    completedAt: {
      type: DataTypes.DATE,
      field: "completed_at",
    },
    cooldownEndsAt: {
      type: DataTypes.DATE,
      field: "cooldown_ends_at",
    },
    earnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
    proof: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: "task_executions",
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "task_id"],
        name: "task_executions_user_task_unique",
      },
      {
        fields: ["executed_at"],
        name: "task_executions_executed_at",
      },
      {
        fields: ["cooldown_ends_at"],
        name: "task_executions_cooldown_ends_at",
      },
    ],
  }
);

TaskExecution.belongsTo(User, { foreignKey: "userId" });
TaskExecution.belongsTo(Task, { foreignKey: "taskId" });

User.hasMany(TaskExecution, { foreignKey: "userId" });
Task.hasMany(TaskExecution, { foreignKey: "taskId" });

export default TaskExecution;
