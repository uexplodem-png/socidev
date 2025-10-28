const { sequelize } = require('../src/config/database.js');

async function updatePermissions() {
  try {
    console.log('🔄 Updating Admin and Moderator permissions...\n');

    // Get role IDs
    const [roles] = await sequelize.query(`
      SELECT id, \`key\`, label FROM roles WHERE \`key\` IN ('admin', 'moderator')
    `);

    const adminRole = roles.find(r => r.key === 'admin');
    const moderatorRole = roles.find(r => r.key === 'moderator');

    if (!adminRole || !moderatorRole) {
      throw new Error('Admin or Moderator role not found!');
    }

    console.log(`Found Admin role: ${adminRole.label} (ID: ${adminRole.id})`);
    console.log(`Found Moderator role: ${moderatorRole.label} (ID: ${moderatorRole.id})\n`);

    // Get all permissions
    const [permissions] = await sequelize.query(`
      SELECT id, \`key\` FROM permissions ORDER BY \`key\`
    `);

    console.log(`Total permissions available: ${permissions.length}\n`);

    // Define which permissions each role should have
    const adminPermissions = [
      // Users - full access
      'users.view', 'users.edit', 'users.create', 'users.ban',
      // Orders - full access
      'orders.view', 'orders.edit', 'orders.refund', 'orders.cancel',
      // Transactions - full access
      'transactions.view', 'transactions.approve', 'transactions.reject', 'transactions.adjust', 'transactions.create',
      // Tasks - full access
      'tasks.view', 'tasks.review', 'tasks.approve', 'tasks.reject',
      // Withdrawals - full access
      'withdrawals.view', 'withdrawals.process',
      // Devices - full access
      'devices.view', 'devices.manage',
      // Analytics - view access
      'analytics.view',
      // Settings - full access
      'settings.view', 'settings.edit',
      // Audit logs - view access
      'audit_logs.view', 'action_logs.view',
    ];

    const moderatorPermissions = [
      // Users - view only
      'users.view',
      // Orders - view and edit
      'orders.view', 'orders.edit',
      // Transactions - view only
      'transactions.view',
      // Tasks - view and review
      'tasks.view', 'tasks.review',
      // Withdrawals - view only
      'withdrawals.view',
      // Devices - view only
      'devices.view',
      // Analytics - view access
      'analytics.view',
      // Settings - view only
      'settings.view',
      // Audit logs - view access
      'audit_logs.view', 'action_logs.view',
    ];

    // Update Admin permissions
    console.log('📝 Updating Admin permissions...');
    await sequelize.query(`DELETE FROM role_permissions WHERE role_id = ?`, {
      replacements: [adminRole.id]
    });

    for (const permKey of adminPermissions) {
      const perm = permissions.find(p => p.key === permKey);
      if (perm) {
        await sequelize.query(`
          INSERT INTO role_permissions (role_id, permission_id, mode, allow, created_at, updated_at)
          VALUES (?, ?, 'all', 1, NOW(), NOW())
        `, {
          replacements: [adminRole.id, perm.id]
        });
      } else {
        console.warn(`⚠️  Permission not found: ${permKey}`);
      }
    }
    console.log(`✅ Admin role updated with ${adminPermissions.length} permissions\n`);

    // Update Moderator permissions
    console.log('📝 Updating Moderator permissions...');
    await sequelize.query(`DELETE FROM role_permissions WHERE role_id = ?`, {
      replacements: [moderatorRole.id]
    });

    for (const permKey of moderatorPermissions) {
      const perm = permissions.find(p => p.key === permKey);
      if (perm) {
        await sequelize.query(`
          INSERT INTO role_permissions (role_id, permission_id, mode, allow, created_at, updated_at)
          VALUES (?, ?, 'all', 1, NOW(), NOW())
        `, {
          replacements: [moderatorRole.id, perm.id]
        });
      } else {
        console.warn(`⚠️  Permission not found: ${permKey}`);
      }
    }
    console.log(`✅ Moderator role updated with ${moderatorPermissions.length} permissions\n`);

    // Verify the changes
    console.log('🔍 Verifying updated permissions...\n');
    
    const [adminPerms] = await sequelize.query(`
      SELECT p.\`key\`
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ? AND rp.allow = 1
      ORDER BY p.\`key\`
    `, {
      replacements: [adminRole.id]
    });

    const [modPerms] = await sequelize.query(`
      SELECT p.\`key\`
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ? AND rp.allow = 1
      ORDER BY p.\`key\`
    `, {
      replacements: [moderatorRole.id]
    });

    console.log(`Admin permissions (${adminPerms.length}):`);
    console.log(adminPerms.map(p => `  - ${p.key}`).join('\n'));
    console.log('');

    console.log(`Moderator permissions (${modPerms.length}):`);
    console.log(modPerms.map(p => `  - ${p.key}`).join('\n'));
    console.log('');

    console.log('✅ Permissions updated successfully!');
    console.log('\n📋 Menu Access Summary:');
    console.log('');
    console.log('Admin will see:');
    console.log('  ✅ Dashboard');
    console.log('  ✅ Users (full access)');
    console.log('  ✅ Orders (full access)');
    console.log('  ✅ Transactions (full access)');
    console.log('  ✅ Balance (view)');
    console.log('  ✅ Withdrawals (full access)');
    console.log('  ✅ Social Accounts (view)');
    console.log('  ✅ Tasks (full access)');
    console.log('  ✅ Task Submissions (full access)');
    console.log('  ✅ Devices (full access)');
    console.log('  ✅ Analytics (view)');
    console.log('  ✅ Audit Logs (view)');
    console.log('  ✅ Settings (full access)');
    console.log('');
    console.log('Moderator will see:');
    console.log('  ✅ Dashboard');
    console.log('  ✅ Users (view only)');
    console.log('  ✅ Orders (view & edit)');
    console.log('  ✅ Transactions (view only)');
    console.log('  ✅ Balance (view)');
    console.log('  ✅ Withdrawals (view only)');
    console.log('  ✅ Social Accounts (view)');
    console.log('  ✅ Tasks (view & review)');
    console.log('  ✅ Task Submissions (view & review)');
    console.log('  ✅ Devices (view only)');
    console.log('  ✅ Analytics (view)');
    console.log('  ✅ Audit Logs (view)');
    console.log('  ✅ Settings (view only)');
    console.log('');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

updatePermissions();
