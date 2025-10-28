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
    field: 'user_id',
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
    type: DataTypes.STRING,
    field: 'ip_address'
  },
  userAgent: {
    type: DataTypes.STRING,
    field: 'user_agent'
  }
}, {
  tableName: 'activity_logs',
  underscored: true
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