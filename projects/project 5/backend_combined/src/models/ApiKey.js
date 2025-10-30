import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ApiKey = sequelize.define(
  'ApiKey',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id',
    },
    apiKey: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: 'api_key',
    },
    apiSecret: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'api_secret',
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'revoked'),
      defaultValue: 'active',
      allowNull: false,
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_used_at',
    },
    totalRequests: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'total_requests',
    },
    rateLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 1000,
      allowNull: false,
      field: 'rate_limit',
    },
    allowedIps: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'allowed_ips',
      get() {
        const value = this.getDataValue('allowedIps');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('allowedIps', JSON.stringify(value || []));
      },
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
  },
  {
    tableName: 'api_keys',
    timestamps: true,
    underscored: true,
  }
);

export default ApiKey;
