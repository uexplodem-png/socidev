import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';
import Order from './Order.js';

const Dispute = sequelize.define('Dispute', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Order,
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('order_issue', 'payment_issue', 'technical_issue', 'other'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('open', 'under_review', 'resolved', 'closed'),
    defaultValue: 'open'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  resolution: {
    type: DataTypes.TEXT
  },
  resolvedAt: {
    type: DataTypes.DATE
  }
});

Dispute.belongsTo(User, { foreignKey: 'userId' });
Dispute.belongsTo(Order, { foreignKey: 'orderId' });

export default Dispute;