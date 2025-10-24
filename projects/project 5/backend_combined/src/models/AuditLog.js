import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  actor_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  actor_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  actor_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  resource: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  resource_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  target_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  target_user_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
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
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'audit_logs',
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
    actor_id: actorId,
    actor_name: `${actorFirstName} ${actorLastName}`,
    actor_email: actor.email,
    action,
    resource,
    resource_id: resourceId,
    target_user_id: targetUserId,
    target_user_name: targetUser ? `${targetFirstName} ${targetLastName}` : null,
    description: description || `${action.replace('_', ' ')} performed on ${resource}`,
    metadata,
    ip_address: req ? req.ip : null,
    user_agent: req ? req.get('User-Agent') : null,
  });
};

export default AuditLog;