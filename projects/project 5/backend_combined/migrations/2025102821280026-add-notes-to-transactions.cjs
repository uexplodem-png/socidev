'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('transactions', 'notes', {
      type: Sequelize.STRING(500),
      allowNull: true,
      after: 'description'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('transactions', 'notes');
  }
};
