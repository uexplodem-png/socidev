'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, check if the column exists and modify it
    await queryInterface.changeColumn('tasks', 'user_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('tasks', 'user_id', {
      type: Sequelize.UUID,
      allowNull: false,
    });
  }
};
