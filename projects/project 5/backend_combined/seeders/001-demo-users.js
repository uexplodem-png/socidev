'use strict';

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    const saltRounds = 12;
    
    const users = [
      {
        id: uuidv4(),
        email: 'admin@example.com',
        password: await bcrypt.hash('AdminPassword123!', saltRounds),
        first_name: 'Admin',
        last_name: 'User',
        username: 'admin',
        role: 'admin',
        status: 'active',
        balance: 10000.00,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        email: 'superadmin@example.com',
        password: await bcrypt.hash('SuperAdminPassword123!', saltRounds),
        first_name: 'Super',
        last_name: 'Admin',
        username: 'superadmin',
        role: 'super_admin',
        status: 'active',
        balance: 50000.00,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        email: 'john.doe@example.com',
        password: await bcrypt.hash('UserPassword123!', saltRounds),
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        role: 'task_giver',
        status: 'active',
        balance: 500.00,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        email: 'jane.smith@example.com',
        password: await bcrypt.hash('UserPassword123!', saltRounds),
        first_name: 'Jane',
        last_name: 'Smith',
        username: 'janesmith',
        role: 'task_doer',
        status: 'active',
        balance: 250.00,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        email: 'mike.johnson@example.com',
        password: await bcrypt.hash('UserPassword123!', saltRounds),
        first_name: 'Mike',
        last_name: 'Johnson',
        username: 'mikejohnson',
        role: 'task_giver',
        status: 'active',
        balance: 1000.00,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('users', users);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};