import crypto from 'crypto';
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

const DesktopApiKey = sequelize.define('DesktopApiKey', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Friendly name for the API key'
  },
  apiKey: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
    comment: 'SHA256 hashed API key'
  },
  apiSecret: {
    type: DataTypes.STRING(128),
    allowNull: false,
    comment: 'Encrypted API secret for request signing'
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {
      getTasks: true,
      getTaskDetails: true,
      getInProgressTasks: true,
      completeTask: true,
      uploadScreenshot: true
    },
    comment: 'API permissions'
  },
  rateLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
    comment: 'Requests per hour'
  },
  ipWhitelist: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of whitelisted IP addresses'
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastUsedIp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  requestCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total requests made'
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'revoked'),
    defaultValue: 'active'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Optional expiration date'
  }
}, {
  tableName: 'desktop_api_keys',
  timestamps: true,
  underscored: true
});

// Static method to generate API key pair
DesktopApiKey.generateKeyPair = function() {
  // "Social Developer Meva Firdevs" letters
  const brandLetters = 'SocialDeveloperMevaFirdevs'.split('');
  
  // Shuffle the letters randomly
  const shuffledLetters = brandLetters.sort(() => Math.random() - 0.5).join('');
  
  // Generate additional random characters for security
  const randomPart = crypto.randomBytes(12).toString('hex'); // 24 chars
  
  // Combine: socidev + shuffled brand letters + random part
  const apiKey = 'socidev_' + shuffledLetters + '_' + randomPart;
  
  // Generate secret separately
  const apiSecret = crypto.randomBytes(48).toString('hex');
  
  return {
    apiKey,
    apiSecret,
    hashedKey: crypto.createHash('sha256').update(apiKey).digest('hex')
  };
};

// Instance method to verify API secret
DesktopApiKey.prototype.verifySecret = function(secret) {
  return crypto.timingSafeEqual(
    Buffer.from(this.apiSecret),
    Buffer.from(secret)
  );
};

// Instance method to generate request signature
DesktopApiKey.prototype.generateSignature = function(method, path, timestamp, body = '') {
  const message = `${method}:${path}:${timestamp}:${body}`;
  return crypto.createHmac('sha256', this.apiSecret)
    .update(message)
    .digest('hex');
};

DesktopApiKey.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(DesktopApiKey, { foreignKey: 'userId' });

export default DesktopApiKey;
