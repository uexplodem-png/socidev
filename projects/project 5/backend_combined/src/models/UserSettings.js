import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

const UserSettings = sequelize.define('UserSettings', {
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
  notifications: {
    type: DataTypes.JSON,
    defaultValue: {
      email: true,
      browser: true
    }
  },
  privacy: {
    type: DataTypes.JSON,
    defaultValue: {
      hideProfile: false,
      hideStats: false
    }
  },
  language: {
    type: DataTypes.ENUM('en', 'tr'),
    defaultValue: 'en'
  },
  theme: {
    type: DataTypes.ENUM('light', 'dark', 'system'),
    defaultValue: 'system'
  }
});

UserSettings.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(UserSettings, { foreignKey: 'userId' });

export default UserSettings;