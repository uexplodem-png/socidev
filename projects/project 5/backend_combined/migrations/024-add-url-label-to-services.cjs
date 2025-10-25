'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if column already exists
      const table = await queryInterface.describeTable('services');
      if (table.url_label) {
        console.log('Column url_label already exists');
        return;
      }

      await queryInterface.addColumn('services', 'url_label', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'url_pattern',
      });

      console.log('Added url_label column to services table');
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('services', 'url_label');
      console.log('Removed url_label column from services table');
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  }
};
