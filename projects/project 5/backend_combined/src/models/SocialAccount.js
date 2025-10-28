import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

const SocialAccount = sequelize.define('SocialAccount', {
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
  platform: {
    type: DataTypes.ENUM('instagram', 'youtube', 'twitter', 'tiktok'),
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  accountId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'account_id'
  },
  profileUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'profile_url'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'error', 'suspended', 'banned'),
    defaultValue: 'active'
  },
  followersCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'followers_count'
  },
  followingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'following_count'
  },
  postsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'posts_count'
  },
  lastActivity: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_activity'
  },
  healthScore: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    field: 'health_score'
  },
  verificationStatus: {
    type: DataTypes.ENUM('pending', 'verified', 'failed'),
    defaultValue: 'pending',
    field: 'verification_status'
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'access_token'
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'refresh_token'
  },
  tokenExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'token_expires_at'
  },
  accountData: {
    type: DataTypes.JSON,
    defaultValue: {},
    field: 'account_data'
  },
  errorCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'error_count'
  },
  lastError: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'last_error'
  },
  lastErrorAt: {
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