'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add i18n fields to platforms table
    const platformColumns = await queryInterface.describeTable('platforms');
    
    if (!platformColumns.name_en) {
      await queryInterface.addColumn('platforms', 'name_en', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    
    if (!platformColumns.name_tr) {
      await queryInterface.addColumn('platforms', 'name_tr', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    
    if (!platformColumns.description_en) {
      await queryInterface.addColumn('platforms', 'description_en', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
    
    if (!platformColumns.description_tr) {
      await queryInterface.addColumn('platforms', 'description_tr', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    // Add i18n fields to services table
    const serviceColumns = await queryInterface.describeTable('services');
    
    if (!serviceColumns.name_en) {
      await queryInterface.addColumn('services', 'name_en', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    
    if (!serviceColumns.name_tr) {
      await queryInterface.addColumn('services', 'name_tr', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    
    if (!serviceColumns.description_en) {
      await queryInterface.addColumn('services', 'description_en', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
    
    if (!serviceColumns.description_tr) {
      await queryInterface.addColumn('services', 'description_tr', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
    
    if (!serviceColumns.features_en) {
      await queryInterface.addColumn('services', 'features_en', {
        type: Sequelize.JSON,
        defaultValue: [],
        allowNull: true,
      });
    }
    
    if (!serviceColumns.features_tr) {
      await queryInterface.addColumn('services', 'features_tr', {
        type: Sequelize.JSON,
        defaultValue: [],
        allowNull: true,
      });
    }
    
    if (!serviceColumns.url_pattern) {
      await queryInterface.addColumn('services', 'url_pattern', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    // Remove i18n fields from platforms table
    try {
      await queryInterface.removeColumn('platforms', 'name_en');
    } catch (e) {
      // Column might not exist
    }
    
    try {
      await queryInterface.removeColumn('platforms', 'name_tr');
    } catch (e) {}
    
    try {
      await queryInterface.removeColumn('platforms', 'description_en');
    } catch (e) {}
    
    try {
      await queryInterface.removeColumn('platforms', 'description_tr');
    } catch (e) {}

    // Remove i18n fields from services table
    try {
      await queryInterface.removeColumn('services', 'name_en');
    } catch (e) {}
    
    try {
      await queryInterface.removeColumn('services', 'name_tr');
    } catch (e) {}
    
    try {
      await queryInterface.removeColumn('services', 'description_en');
    } catch (e) {}
    
    try {
      await queryInterface.removeColumn('services', 'description_tr');
    } catch (e) {}
    
    try {
      await queryInterface.removeColumn('services', 'features_en');
    } catch (e) {}
    
    try {
      await queryInterface.removeColumn('services', 'features_tr');
    } catch (e) {}
    
    try {
      await queryInterface.removeColumn('services', 'url_pattern');
    } catch (e) {}
  },
};
