import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

const SocialAccount = sequelize.define('SocialAccount', {
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
  platform: {
    type: DataTypes.ENUM('instagram', 'youtube', 'twitter', 'tiktok'),
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  account_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'account_id'
  },
  profile_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'profile_url'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'error', 'suspended', 'banned'),
    defaultValue: 'active'
  },
  followers_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'followers_count'
  },
  following_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'following_count'
  },
  posts_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'posts_count'
  },
  last_activity: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_activity'
  },
  health_score: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    field: 'health_score'
  },
  verification_status: {
    type: DataTypes.ENUM('pending', 'verified', 'failed'),
    defaultValue: 'pending',
    field: 'verification_status'
  },
  access_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'access_token'
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'refresh_token'
  },
  token_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'token_expires_at'
  },
  account_data: {
    type: DataTypes.JSON,
    defaultValue: {},
    field: 'account_data'
  },
  error_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'error_count'
  },
  last_error: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'last_error'
  },
  last_error_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_error_at'
  }
}, {
  tableName: 'social_accounts',
  underscored: true,
  timestamps: true
});

export default SocialAccount;