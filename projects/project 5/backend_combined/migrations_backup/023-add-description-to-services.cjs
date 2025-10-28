'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('services', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'name',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('services', 'description');
  },
};
