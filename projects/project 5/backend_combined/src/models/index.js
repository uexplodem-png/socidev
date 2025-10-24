import { sequelize } from '../config/database.js';
import User from './User.js';
import Order from './Order.js';
import Task from './Task.js';
import Transaction from './Transaction.js';
import Withdrawal from './Withdrawal.js';
import AuditLog from './AuditLog.js';
import Device from './Device.js';
import SocialAccount from './SocialAccount.js';
import Platform from './Platform.js';
import Service from './Service.js';
// Additional models from old backend
import ActivityLog from './ActivityLog.js';
import Dispute from './Dispute.js';
import OrderStatistics from './OrderStatistics.js';
import PaymentGateway from './PaymentGateway.js';
import Refund from './Refund.js';
import Session from './Session.js';
import TaskExecution from './TaskExecution.js';
import UserSettings from './UserSettings.js';

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
  User.hasMany(Task, { foreignKey: 'user_id', as: 'tasks' });
  User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
  User.hasMany(Withdrawal, { foreignKey: 'user_id', as: 'withdrawals' });
  User.hasMany(Device, { foreignKey: 'user_id', as: 'devices' });
  User.hasMany(SocialAccount, { foreignKey: 'user_id', as: 'socialAccounts' });
  User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activityLogs' });
  User.hasMany(Session, { foreignKey: 'user_id', as: 'sessions' });
  User.hasOne(UserSettings, { foreignKey: 'user_id', as: 'settings' });

  // Order associations
  Order.belongsTo(User, { 
    foreignKey: 'user_id', 
    as: 'user',
    onDelete: 'CASCADE', // Match the migration file
    onUpdate: 'CASCADE'
  });
  Order.hasMany(Transaction, { foreignKey: 'order_id', as: 'transactions' });
  Order.hasMany(Dispute, { foreignKey: 'order_id', as: 'disputes' });
  Order.hasMany(Refund, { foreignKey: 'order_id', as: 'refunds' });

  // Task associations
  Task.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Task.belongsTo(User, { foreignKey: 'admin_reviewed_by', as: 'reviewer' });
  Task.hasMany(TaskExecution, { foreignKey: 'task_id', as: 'executions' });
  Task.hasMany(Dispute, { foreignKey: 'task_id', as: 'disputes' });

  // Transaction associations
  Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Transaction.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

  // Withdrawal associations
  Withdrawal.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Withdrawal.belongsTo(User, { foreignKey: 'processed_by', as: 'processor' });
  Withdrawal.hasMany(Refund, { foreignKey: 'withdrawal_id', as: 'refunds' });

  // Device associations
  Device.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Social Account associations
  SocialAccount.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Audit Log associations
  AuditLog.belongsTo(User, { foreignKey: 'actor_id', as: 'actor' });
  AuditLog.belongsTo(User, { foreignKey: 'target_user_id', as: 'targetUser' });

  // Session associations
  Session.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Dispute associations
  Dispute.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
  Dispute.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
  Dispute.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Refund associations
  Refund.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
  Refund.belongsTo(Withdrawal, { foreignKey: 'withdrawal_id', as: 'withdrawal' });

  // Task Execution associations
  TaskExecution.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
};

// Initialize associations
defineAssociations();

// Export models and sequelize instance
export {
  sequelize,
  User,
  Order,
  Task,
  Transaction,
  Withdrawal,
  AuditLog,
  ActivityLog,
  Device,
  SocialAccount,
  Platform,
  Service,
  Dispute,
  OrderStatistics,
  PaymentGateway,
  Refund,
  Session,
  TaskExecution,
  UserSettings,
};