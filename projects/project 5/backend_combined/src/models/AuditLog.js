import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  actorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'actor_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  actorName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'actor_name',
  },
  actorEmail: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'actor_email',
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  resource: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  resourceId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'resource_id',
  },
  targetUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'target_user_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  targetUserName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'target_user_name',
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    get() {
      const value = this.getDataValue('metadata');
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      }
      return value || {};
    },
    set(value) {
      this.setDataValue('metadata', value);
    },
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
}, {
  tableName: 'audit_logs',
  underscored: true,
  indexes: [
    {
      fields: ['actor_id'],
    },
    {
      fields: ['action'],
    },
    {
      fields: ['resource'],
    },
    {
      fields: ['resource_id'],
    },
    {
      fields: ['target_user_id'],
    },
    {
      fields: ['created_at'],
    },
  ],
});

// Define relationships (these will be defined in the models index)
// AuditLog.belongsTo(User, { foreignKey: 'actor_id', as: 'actor' });
// AuditLog.belongsTo(User, { foreignKey: 'target_user_id', as: 'targetUser' });

// Static methods
AuditLog.log = async function(actorId, action, resource, resourceId, targetUserId = null, description = '', metadata = {}, req = null) {
  const actor = await sequelize.models.User.findByPk(actorId);
  const targetUser = targetUserId ? await sequelize.models.User.findByPk(targetUserId) : null;
  
  if (!actor) {
    throw new Error(`Actor user not found with ID: ${actorId}`);
  }
  
  // Handle both camelCase and snake_case property names (camelCase first since that's what Sequelize uses)
  const actorFirstName = actor.firstName || actor.first_name || 'Unknown';
  const actorLastName = actor.lastName || actor.last_name || 'User';
  const targetFirstName = targetUser ? (targetUser.firstName || targetUser.first_name || '') : '';
  const targetLastName = targetUser ? (targetUser.lastName || targetUser.last_name || '') : '';
  
  return this.create({
    actorId: actorId,
    actorName: `${actorFirstName} ${actorLastName}`,
    actorEmail: actor.email,
    action,
    resource,
    resourceId: resourceId,
    targetUserId: targetUserId,
    targetUserName: targetUser ? `${targetFirstName} ${targetLastName}` : null,
    description: description || `${action.replace('_', ' ')} performed on ${resource}`,
    metadata,
    ipAddress: req ? req.ip : null,
    userAgent: req ? req.get('User-Agent') : null,
  });
};

export default AuditLog;