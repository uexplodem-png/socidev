import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';
import Transaction from './Transaction.js';

const Refund = sequelize.define('Refund', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: User,
      key: 'id'
    }
  },
  transactionId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'transaction_id',
    references: {
      model: Transaction,
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'),
    defaultValue: 'pending'
  },
  processedAt: {
    type: DataTypes.DATE,
    field: 'processed_at'
  }
}, {
  tableName: 'refunds',
  underscored: true
});

Refund.belongsTo(User, { foreignKey: 'userId' });
Refund.belongsTo(Transaction, { foreignKey: 'transactionId' });

export default Refund;