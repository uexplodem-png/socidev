'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user_settings', 'api_config', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Desktop application API configuration'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_settings', 'api_config');
  }
};
