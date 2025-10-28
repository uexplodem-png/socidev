'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, change the column type to STRING to avoid ENUM constraint issues
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.STRING(255),
      defaultValue: 'task_doer',
    });

    // Then, update existing data to map old role values to new ones
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET role = CASE 
        WHEN role = 'user' THEN 'task_doer'
        WHEN role = 'admin' THEN 'admin'
        WHEN role = 'super_admin' THEN 'super_admin'
        ELSE 'task_doer'
      END
    `);

    // Finally, change the column back to ENUM with new values
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('task_doer', 'task_giver', 'admin', 'super_admin', 'moderator'),
      defaultValue: 'task_doer',
    });
  },

  async down(queryInterface, Sequelize) {
    // First, change the column type to STRING to avoid ENUM constraint issues
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.STRING(255),
      defaultValue: 'user',
    });

    // Then, update existing data to map new role values to old ones
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET role = CASE 
        WHEN role = 'task_doer' THEN 'user'
        WHEN role = 'task_giver' THEN 'user'
        WHEN role = 'admin' THEN 'admin'
        WHEN role = 'super_admin' THEN 'super_admin'
        WHEN role = 'moderator' THEN 'user'
        ELSE 'user'
      END
    `);

    // Finally, change the column back to ENUM with old values
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('user', 'admin', 'super_admin'),
      defaultValue: 'user',
    });
  }
};