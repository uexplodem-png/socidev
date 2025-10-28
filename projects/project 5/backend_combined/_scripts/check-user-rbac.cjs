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

async function checkUserRBAC() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Get all users with their RBAC roles
    const [users] = await sequelize.query(`
      SELECT 
        u.id,
        u.email,
        u.role as legacy_role,
        ur.role_id,
        r.key as rbac_role_key,
        r.label as rbac_role_label,
        COUNT(DISTINCT p.id) as permission_count
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.allow = 1
      LEFT JOIN permissions p ON rp.permission_id = p.id
      GROUP BY u.id, u.email, u.role, ur.role_id, r.key, r.label
      HAVING ur.role_id IS NOT NULL
      ORDER BY ur.role_id, u.email
      LIMIT 20;
    `);

    console.log('📋 Users with RBAC Roles:\n');
    console.log('ID | Email | Legacy Role | RBAC Role | Permissions');
    console.log('-'.repeat(100));
    
    users.forEach(user => {
      console.log(
        `${user.id.substring(0, 8)}... | ${user.email.padEnd(30)} | ${(user.legacy_role || 'none').padEnd(12)} | ${(user.rbac_role_key || 'none').padEnd(15)} | ${user.permission_count || 0}`
      );
    });

    console.log('\n');
    
    // Check for super admins specifically
    const [superAdmins] = await sequelize.query(`
      SELECT u.email, u.role, ur.role_id, r.key
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.key = 'super_admin'
      ORDER BY u.email;
    `);

    console.log(`\n🔑 Super Admin Users (${superAdmins.length}):`);
    superAdmins.forEach(sa => {
      console.log(`  - ${sa.email} (legacy role: ${sa.role})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkUserRBAC();
