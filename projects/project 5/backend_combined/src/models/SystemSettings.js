import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class SystemSettings extends Model {}

SystemSettings.init(
  {
    key: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.JSON,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    updated_by: {
      type: DataTypes.STRING(36),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'SystemSettings',
    tableName: 'system_settings',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default SystemSettings;
