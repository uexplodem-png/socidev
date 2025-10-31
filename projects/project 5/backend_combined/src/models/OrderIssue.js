import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const OrderIssue = sequelize.define('OrderIssue', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'order_id',
    references: {
      model: 'orders',
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'admin_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  senderType: {
    type: DataTypes.ENUM('user', 'admin'),
    allowNull: false,
    field: 'sender_type',
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
    defaultValue: 'open',
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address',
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent',
  },
}, {
  tableName: 'order_issues',
  underscored: true,
  indexes: [
    {
      fields: ['order_id', 'created_at'],
      name: 'idx_order_issues_order_created',
    },
    {
      fields: ['status', 'created_at'],
      name: 'idx_order_issues_status_created',
    },
    {
      fields: ['user_id'],
      name: 'idx_order_issues_user',
    },
  ],
});

export default OrderIssue;
