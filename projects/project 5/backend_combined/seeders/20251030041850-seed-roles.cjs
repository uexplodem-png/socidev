'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = [
      // Admin Panel Roles
      {
        key: 'super_admin',
        label: 'Super Admin',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        key: 'admin',
        label: 'Admin',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        key: 'moderator',
        label: 'Moderator',
        created_at: new Date(),
        updated_at: new Date(),
      },
      
      // Member Panel Roles
      {
        key: 'task_giver',
        label: 'Task Giver',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        key: 'task_doer',
        label: 'Task Doer',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('roles', roles, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  },
};
