import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Permission extends Model {}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    label: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    group: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Permission',
    tableName: 'permissions',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Permission;
