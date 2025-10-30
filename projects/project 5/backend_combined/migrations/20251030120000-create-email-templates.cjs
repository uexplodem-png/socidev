'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('email_templates', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Template name for identification'
      },
      key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Unique key for programmatic access'
      },
      subject: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Email subject with variable support'
      },
      body_html: {
        type: Sequelize.TEXT('long'),
        allowNull: false,
        comment: 'HTML email body with variable support'
      },
      body_text: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Plain text email body (optional fallback)'
      },
      variables: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Available variables for this template'
      },
      category: {
        type: Sequelize.ENUM('transactional', 'marketing', 'notification', 'system'),
        defaultValue: 'transactional',
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true
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
    try {
      await queryInterface.addIndex('email_templates', ['key'], { unique: true, name: 'email_templates_key_unique' });
    } catch (e) {
      // Index might already exist
    }
    try {
      await queryInterface.addIndex('email_templates', ['category'], { name: 'email_templates_category' });
    } catch (e) {}
    try {
      await queryInterface.addIndex('email_templates', ['is_active'], { name: 'email_templates_is_active' });
    } catch (e) {}
    try {
      await queryInterface.addIndex('email_templates', ['created_at'], { name: 'email_templates_created_at' });
    } catch (e) {}

    // Templates will be added through seeder or admin panel
    // Skip initial data insertion to avoid migration issues
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('email_templates');
  }
};
