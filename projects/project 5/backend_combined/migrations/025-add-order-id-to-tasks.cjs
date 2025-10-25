'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tasks', 'order_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // Add index for performance
    await queryInterface.addIndex('tasks', ['order_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('tasks', ['order_id']);
    await queryInterface.removeColumn('tasks', 'order_id');
  }
};
