'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('email_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      template_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Reference to email template if used'
      },
      recipient_email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Email address of recipient'
      },
      recipient_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Name of recipient'
      },
      recipient_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'User ID if recipient is a registered user'
      },
      subject: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Email subject line'
      },
      body_html: {
        type: Sequelize.TEXT('long'),
        allowNull: false,
        comment: 'HTML email body sent'
      },
      body_text: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Plain text email body sent'
      },
      variables_used: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Variables and their values used in this email'
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'failed', 'bounced'),
        defaultValue: 'pending',
        allowNull: false
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error message if sending failed'
      },
      sent_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Admin user who sent the email'
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when email was sent'
      },
      opened_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when email was opened (if tracking enabled)'
      },
      clicked_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when link was clicked (if tracking enabled)'
      },
      provider: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'smtp',
        comment: 'Email provider used (smtp, sendgrid, mailgun, etc.)'
      },
      provider_message_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Message ID from email provider'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Indexes
    await queryInterface.addIndex('email_logs', ['template_id']);
    await queryInterface.addIndex('email_logs', ['recipient_email']);
    await queryInterface.addIndex('email_logs', ['recipient_user_id']);
    await queryInterface.addIndex('email_logs', ['status']);
    await queryInterface.addIndex('email_logs', ['sent_by']);
    await queryInterface.addIndex('email_logs', ['created_at']);
    await queryInterface.addIndex('email_logs', ['sent_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('email_logs');
  }
};
