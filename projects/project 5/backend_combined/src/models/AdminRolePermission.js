import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const AdminRolePermission = sequelize.define(
  'AdminRolePermission',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'admin', 'moderator'),
      allowNull: false,
      comment: 'Admin role: super_admin, admin, or moderator',
    },
    permissionKey: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'permission_key',
      comment: 'Permission key (e.g., users.edit, balance.adjust)',
    },
    allow: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this role has this permission',
    },
  },
  {
    tableName: 'admin_role_permissions',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['role', 'permission_key'],
        name: 'idx_admin_role_permission_unique',
      },
      {
        fields: ['role'],
        name: 'idx_admin_role',
      },
      {
        fields: ['permission_key'],
        name: 'idx_permission_key',
      },
    ],
  }
);

export default AdminRolePermission;
