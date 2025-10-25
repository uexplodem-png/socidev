import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Platform = sequelize.define(
  "Platform",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    nameEn: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "name_en",
    },
    nameTr: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "name_tr",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    descriptionEn: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "description_en",
    },
    descriptionTr: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "description_tr",
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "display_order",
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
    },
  },
  {
    tableName: "platforms",
    timestamps: true,
    underscored: true,
  }
);

export default Platform;
