import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class UserRole extends Model {}

UserRole.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'user_id'
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'role_id'
    }
  },
  {
    sequelize,
    modelName: 'UserRole',
    tableName: 'user_roles',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default UserRole;
