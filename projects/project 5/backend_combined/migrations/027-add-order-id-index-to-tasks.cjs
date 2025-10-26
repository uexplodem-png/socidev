'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add index on order_id if it doesn't exist
    const indexes = await queryInterface.showIndex('tasks');
    const hasOrderIdIndex = indexes.some(index => 
      index.fields && index.fields.some(field => field.attribute === 'order_id')
    );
    
    if (!hasOrderIdIndex) {
      await queryInterface.addIndex('tasks', ['order_id'], {
        name: 'tasks_order_id_idx'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('tasks', 'tasks_order_id_idx');
  }
};
