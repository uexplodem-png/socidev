import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class RolePermission extends Model {}

RolePermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    mode: {
      type: DataTypes.ENUM('all', 'taskDoer', 'taskGiver'),
      allowNull: false,
      defaultValue: 'all'
    },
    allow: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  },
  {
    sequelize,
    modelName: 'RolePermission',
    tableName: 'role_permissions',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default RolePermission;
