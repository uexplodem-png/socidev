import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const PaymentGateway = sequelize.define('PaymentGateway', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  provider: {
    type: DataTypes.ENUM('stripe', 'paypal', 'crypto'),
    allowNull: false
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD'
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
});

export default PaymentGateway;