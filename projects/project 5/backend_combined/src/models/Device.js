import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  deviceName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'device_name'
  },
  deviceType: {
    type: DataTypes.ENUM('mobile', 'desktop', 'tablet', 'server'),
    allowNull: false,
    field: 'device_type'
  },
  browser: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  platform: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'banned', 'maintenance'),
    defaultValue: 'active'
  },
  lastActive: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_active'
  },
  tasksCompleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'tasks_completed'
  },
  deviceFingerprint: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'device_fingerprint'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent'
  },
  screenResolution: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'screen_resolution'
  },
  timezone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  configuration: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'devices',
  underscored: true,
  timestamps: true
});

export default Device;