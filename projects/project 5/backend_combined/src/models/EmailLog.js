import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const EmailLog = sequelize.define('EmailLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  templateId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'template_id'
  },
  recipientEmail: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'recipient_email'
  },
  recipientName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'recipient_name'
  },
  recipientUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'recipient_user_id'
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
  variablesUsed: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'variables_used'
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed', 'bounced'),
    defaultValue: 'pending',
    allowNull: false
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message'
  },
  sentBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'sent_by'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sent_at'
  },
  openedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'opened_at'
  },
  clickedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'clicked_at'
  },
  provider: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'smtp'
  },
  providerMessageId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'provider_message_id'
  }
}, {
  tableName: 'email_logs',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['template_id'] },
    { fields: ['recipient_email'] },
    { fields: ['recipient_user_id'] },
    { fields: ['status'] },
    { fields: ['sent_by'] },
    { fields: ['created_at'] },
    { fields: ['sent_at'] }
  ]
});

export default EmailLog;
