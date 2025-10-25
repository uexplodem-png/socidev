import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import Platform from "./Platform.js";

const Service = sequelize.define(
  "Service",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    platformId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Platform,
        key: "id",
      },
      field: "platform_id",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    pricePerUnit: {
      type: DataTypes.DECIMAL(10, 5),
      allowNull: false,
      field: "price_per_unit",
    },
    minOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "min_order",
    },
    maxOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "max_order",
    },
    inputFieldName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "input_field_name",
    },
    sampleUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "sample_url",
    },
    features: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    featuresEn: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "features_en",
    },
    featuresTr: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "features_tr",
    },
    urlPattern: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "url_pattern",
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      field: "commission_rate",
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
    tableName: "services",
    timestamps: true,
    underscored: true,
  }
);

// Set up relationship
Service.belongsTo(Platform, {
  foreignKey: "platformId",
  as: "platform",
});

Platform.hasMany(Service, {
  foreignKey: "platformId",
  as: "services",
});

export default Service;
