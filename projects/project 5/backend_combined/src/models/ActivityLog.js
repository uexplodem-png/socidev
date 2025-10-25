import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

const ActivityLog = sequelize.define('ActivityLog', {
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
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  ipAddress: {
    type: DataTypes.STRING
  },
  userAgent: {
    type: DataTypes.STRING
  }
});

ActivityLog.belongsTo(User, { foreignKey: 'userId' });

// Static method to log activity with standard signature
ActivityLog.log = async function(userId, action, resourceType, resourceId, targetUserId, description, metadata = {}, req = null) {
  return await ActivityLog.create({
    userId,
    type: action,
    action: `${resourceType}:${action}`,
    details: {
      resourceType,
      resourceId,
      targetUserId,
      description,
      ...metadata
    },
    ipAddress: req?.ip,
    userAgent: req?.headers?.['user-agent']
  });
};

export default ActivityLog;