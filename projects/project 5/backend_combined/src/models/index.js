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
import SystemSettings from './SystemSettings.js';
import Role from './Role.js';
import Permission from './Permission.js';
import UserRole from './UserRole.js';
import RolePermission from './RolePermission.js';
import AdminRolePermission from './AdminRolePermission.js';
import EmailTemplate from './EmailTemplate.js';
import EmailLog from './EmailLog.js';

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
  User.hasMany(Task, { foreignKey: 'userId', as: 'tasks' });
  User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
  User.hasMany(Withdrawal, { foreignKey: 'userId', as: 'withdrawals' });
  User.hasMany(Device, { foreignKey: 'userId', as: 'devices' });
  User.hasMany(SocialAccount, { foreignKey: 'userId', as: 'socialAccounts' });
  User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs' });
  User.hasMany(Session, { foreignKey: 'userId', as: 'sessions' });
  User.hasOne(UserSettings, { foreignKey: 'userId', as: 'settings' });

  // Order associations
  Order.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user',
    onDelete: 'CASCADE', // Match the migration file
    onUpdate: 'CASCADE'
  });
  Order.hasMany(Transaction, { foreignKey: 'orderId', as: 'transactions' });
  Order.hasMany(Dispute, { foreignKey: 'orderId', as: 'disputes' });
  Order.hasMany(Refund, { foreignKey: 'orderId', as: 'refunds' });
  Order.hasMany(Task, { foreignKey: 'orderId', as: 'tasks' });

  // Task associations
  Task.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Task.belongsTo(User, { foreignKey: 'adminReviewedBy', as: 'reviewer' });
  Task.belongsTo(Order, { foreignKey: 'orderId', as: 'order' }); // Task belongs to an order
  Task.hasMany(TaskExecution, { foreignKey: 'taskId', as: 'executions' });
  Task.hasMany(Dispute, { foreignKey: 'taskId', as: 'disputes' });

  // Transaction associations
  Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Transaction.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

  // Withdrawal associations
  Withdrawal.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Withdrawal.belongsTo(User, { foreignKey: 'processedBy', as: 'processor' });
  Withdrawal.hasMany(Refund, { foreignKey: 'withdrawalId', as: 'refunds' });

  // Device associations
  Device.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Social Account associations
  SocialAccount.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Audit Log associations
  AuditLog.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
  AuditLog.belongsTo(User, { foreignKey: 'targetUserId', as: 'targetUser' });

  // Session associations
  Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Dispute associations
  Dispute.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
  Dispute.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
  Dispute.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Refund associations
  Refund.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
  Refund.belongsTo(Withdrawal, { foreignKey: 'withdrawalId', as: 'withdrawal' });

  // Task Execution associations
  TaskExecution.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

  // RBAC associations
  User.hasMany(UserRole, { foreignKey: 'userId', as: 'userRoles' });
  UserRole.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  UserRole.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
  
  Role.hasMany(UserRole, { foreignKey: 'roleId', as: 'userRoles' });
  Role.hasMany(RolePermission, { foreignKey: 'roleId', as: 'rolePermissions' });
  
  Permission.hasMany(RolePermission, { foreignKey: 'permissionId', as: 'rolePermissions' });
  
  RolePermission.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
  RolePermission.belongsTo(Permission, { foreignKey: 'permissionId', as: 'permission' });

  // Email associations
  EmailTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
  EmailTemplate.hasMany(EmailLog, { foreignKey: 'templateId', as: 'logs' });
  
  EmailLog.belongsTo(EmailTemplate, { foreignKey: 'templateId', as: 'template' });
  EmailLog.belongsTo(User, { foreignKey: 'recipientUserId', as: 'recipient' });
  EmailLog.belongsTo(User, { foreignKey: 'sentBy', as: 'sender' });
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
  SystemSettings,
  Role,
  Permission,
  UserRole,
  RolePermission,
  AdminRolePermission,
};