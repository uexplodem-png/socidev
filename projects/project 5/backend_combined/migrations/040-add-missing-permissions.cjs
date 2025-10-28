'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get current timestamp for created_at and updated_at
    const now = new Date();

    // Insert missing permissions
    await queryInterface.bulkInsert('permissions', [
      {
        key: 'analytics.view',
        label: 'View Analytics',
        group: 'analytics',
        created_at: now,
        updated_at: now,
      },
      {
        key: 'withdrawals.view',
        label: 'View Withdrawals',
        group: 'withdrawals',
        created_at: now,
        updated_at: now,
      },
      {
        key: 'withdrawals.process',
        label: 'Process Withdrawals',
        group: 'withdrawals',
        created_at: now,
        updated_at: now,
      },
      {
        key: 'devices.view',
        label: 'View Devices',
        group: 'devices',
        created_at: now,
        updated_at: now,
      },
      {
        key: 'devices.manage',
        label: 'Manage Devices',
        group: 'devices',
        created_at: now,
        updated_at: now,
      },
    ]);

    // Get the permission IDs we just inserted
    const [permissions] = await queryInterface.sequelize.query(`
      SELECT id, \`key\` FROM permissions 
      WHERE \`key\` IN ('analytics.view', 'withdrawals.view', 'withdrawals.process', 'devices.view', 'devices.manage')
    `);

    // Get super_admin and admin role IDs
    const [roles] = await queryInterface.sequelize.query(`
      SELECT id, \`key\` FROM roles WHERE \`key\` IN ('super_admin', 'admin')
    `);

    const superAdminRole = roles.find(r => r.key === 'super_admin');
    const adminRole = roles.find(r => r.key === 'admin');

    // Assign all new permissions to super_admin and admin
    const rolePermissions = [];
    
    permissions.forEach(permission => {
      // Super admin gets all permissions
      if (superAdminRole) {
        rolePermissions.push({
          role_id: superAdminRole.id,
          permission_id: permission.id,
          mode: 'all',
          created_at: now,
          updated_at: now,
        });
      }
      
      // Admin also gets all these permissions
      if (adminRole) {
        rolePermissions.push({
          role_id: adminRole.id,
          permission_id: permission.id,
          mode: 'all',
          created_at: now,
          updated_at: now,
        });
      }
    });

    if (rolePermissions.length > 0) {
      await queryInterface.bulkInsert('role_permissions', rolePermissions);
    }

    console.log('✅ Added missing permissions and assigned to super_admin and admin roles');
  },

  async down(queryInterface, Sequelize) {
    // Remove the permissions we added
    await queryInterface.bulkDelete('permissions', {
      key: {
        [Sequelize.Op.in]: [
          'analytics.view',
          'withdrawals.view',
          'withdrawals.process',
          'devices.view',
          'devices.manage',
        ],
      },
    });

    console.log('✅ Removed added permissions');
  },
};
