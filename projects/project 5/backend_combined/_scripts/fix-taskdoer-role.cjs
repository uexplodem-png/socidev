const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'social_developer',
  process.env.DB_USERNAME || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

async function fixTaskDoerRole() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Get taskdoer user
    const [users] = await sequelize.query(`
      SELECT id, email, role FROM users WHERE email = 'taskdoer@gmail.com';
    `);

    if (users.length === 0) {
      console.log('❌ User taskdoer@gmail.com not found');
      return;
    }

    const userId = users[0].id;
    console.log(`📧 Found user: ${users[0].email}`);
    console.log(`   Current legacy role: ${users[0].role}`);

    // Check current RBAC role
    const [currentRole] = await sequelize.query(`
      SELECT ur.role_id, r.\`key\`, r.label
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?;
    `, { replacements: [userId] });

    if (currentRole.length > 0) {
      console.log(`   Current RBAC role: ${currentRole[0].key} (${currentRole[0].label})`);
    }

    // Get super_admin role
    const [superAdminRole] = await sequelize.query(`
      SELECT id, \`key\`, label FROM roles WHERE \`key\` = 'super_admin';
    `);

    if (superAdminRole.length === 0) {
      console.log('❌ Super Admin role not found in roles table');
      return;
    }

    const superAdminRoleId = superAdminRole[0].id;
    console.log(`\n🔑 Super Admin role ID: ${superAdminRoleId}`);

    // Update user_roles
    await sequelize.query(`
      UPDATE user_roles 
      SET role_id = ? 
      WHERE user_id = ?;
    `, { replacements: [superAdminRoleId, userId] });

    console.log('\n✅ Updated RBAC role to super_admin!');

    // Verify
    const [verifyRole] = await sequelize.query(`
      SELECT r.\`key\`, r.label, COUNT(DISTINCT p.id) as permission_count
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.allow = 1
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ?
      GROUP BY r.\`key\`, r.label;
    `, { replacements: [userId] });

    if (verifyRole.length > 0) {
      console.log(`\n✅ Verified: User now has role "${verifyRole[0].key}" with ${verifyRole[0].permission_count} permissions`);
      console.log('\n📝 Next steps:');
      console.log('   1. Logout from admin panel');
      console.log('   2. Login again with taskdoer@gmail.com / Meva1618');
      console.log('   3. All 14 menus should now appear!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixTaskDoerRole();
