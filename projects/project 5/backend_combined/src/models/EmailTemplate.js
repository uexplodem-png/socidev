import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const EmailTemplate = sequelize.define('EmailTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  bodyHtml: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    field: 'body_html'
  },
  bodyText: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'body_text'
  },
  variables: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  category: {
    type: DataTypes.ENUM('transactional', 'marketing', 'notification', 'system'),
    defaultValue: 'transactional',
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    field: 'is_active'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'created_by'
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'updated_by'
  }
}, {
  tableName: 'email_templates',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['key'], unique: true },
    { fields: ['category'] },
    { fields: ['is_active'] },
    { fields: ['created_at'] }
  ]
});

export default EmailTemplate;
