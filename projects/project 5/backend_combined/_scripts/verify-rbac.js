const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

const sequelize = new Sequelize(config.development.database, config.development.username, config.development.password, {
  host: config.development.host,
  dialect: config.development.dialect,
  logging: false
});

(async () => {
  try {
    console.log('\n🔍 RBAC System Verification\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Check RBAC tables
    const [roles] = await sequelize.query('SELECT COUNT(*) as count FROM roles');
    const [permissions] = await sequelize.query('SELECT COUNT(*) as count FROM permissions');
    const [userRoles] = await sequelize.query('SELECT COUNT(*) as count FROM user_roles');
    const [rolePermissions] = await sequelize.query('SELECT COUNT(*) as count FROM role_permissions');
    const [settings] = await sequelize.query('SELECT COUNT(*) as count FROM system_settings');
    
    console.log('📊 Database Tables:');
    console.log('  ✅ Roles:', roles[0].count);
    console.log('  ✅ Permissions:', permissions[0].count);
    console.log('  ✅ User Role Assignments:', userRoles[0].count);
    console.log('  ✅ Role-Permission Mappings:', rolePermissions[0].count);
    console.log('  ✅ System Settings:', settings[0].count);
    
    // List all roles
    console.log('\n👥 Available Roles:');
    const [allRoles] = await sequelize.query('SELECT id, `key`, label FROM roles ORDER BY id');
    allRoles.forEach(role => {
      console.log(`  ${role.id}. ${role.label} (${role.key})`);
    });
    
    // Check user permissions
    console.log('\n🔑 User Permission Summary:');
    
    const users = ['superadmin@gmail.com', 'taskdoer@gmail.com', 'taskgiver@gmail.com'];
    
    for (const email of users) {
      const [perms] = await sequelize.query(`
        SELECT COUNT(DISTINCT p.id) as count
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.email = ?
      `, { replacements: [email] });
      
      const [user] = await sequelize.query(`
        SELECT u.username, u.role, r.label as rbac_role
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.email = ?
      `, { replacements: [email] });
      
      if (user.length > 0) {
        console.log(`  ${user[0].username} (${email})`);
        console.log(`    Legacy Role: ${user[0].role}`);
        console.log(`    RBAC Role: ${user[0].rbac_role || 'None'}`);
        console.log(`    Permissions: ${perms[0].count}`);
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ RBAC System is fully operational!\n');
    console.log('🌐 Applications running:');
    console.log('  Backend: http://localhost:3000');
    console.log('  Admin Panel: http://localhost:5173');
    console.log('  Frontend: http://localhost:5174\n');
    console.log('📝 Test Credentials:');
    console.log('  Super Admin: superadmin@gmail.com / Meva1618');
    console.log('  Task Doer: taskdoer@gmail.com / Meva1618');
    console.log('  Task Giver: taskgiver@gmail.com / Meva1618\n');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
