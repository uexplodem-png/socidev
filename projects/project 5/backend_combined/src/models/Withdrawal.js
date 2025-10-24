import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

const Withdrawal = sequelize.define('Withdrawal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  method: {
    type: DataTypes.ENUM('bank_transfer', 'crypto', 'paypal'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  details: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'processed_at'
  },
  processed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'processed_by'
  },
  transaction_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'transaction_id'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'rejection_reason'
  }
}, {
  tableName: 'withdrawals',
  underscored: true,
  timestamps: true
});

export default Withdrawal;