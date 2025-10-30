import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ApiLog = sequelize.define(
  'ApiLog',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    apiKeyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'api_key_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    endpoint: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    method: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    statusCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'status_code',
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
    requestBody: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'request_body',
      get() {
        const value = this.getDataValue('requestBody');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('requestBody', value ? JSON.stringify(value) : null);
      },
    },
    responseBody: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'response_body',
      get() {
        const value = this.getDataValue('responseBody');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('responseBody', value ? JSON.stringify(value) : null);
      },
    },
    responseTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'response_time',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message',
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
  },
  {
    tableName: 'api_logs',
    timestamps: false,
    underscored: true,
  }
);

export default ApiLog;
