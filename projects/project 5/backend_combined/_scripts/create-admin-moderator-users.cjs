const { sequelize } = require('../src/config/database.js');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createUsers() {
  try {
    console.log('🔄 Creating Admin and Moderator test users...\n');

    // Get role IDs
    const [roles] = await sequelize.query(`
      SELECT id, \`key\`, label FROM roles WHERE \`key\` IN ('admin', 'moderator')
    `);

    const adminRole = roles.find(r => r.key === 'admin');
    const moderatorRole = roles.find(r => r.key === 'moderator');

    if (!adminRole || !moderatorRole) {
      throw new Error('Admin or Moderator role not found!');
    }

    // Hash password
    const password = 'Meva1618';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Admin user
    const adminId = uuidv4();
    const adminEmail = 'admin@gmail.com';
    
    // Check if admin user exists
    const [existingAdmin] = await sequelize.query(`
      SELECT id FROM users WHERE email = ?
    `, { replacements: [adminEmail] });

    let adminUserId;
    if (existingAdmin.length > 0) {
      console.log('⚠️  Admin user already exists, updating...');
      adminUserId = existingAdmin[0].id;
      await sequelize.query(`
        UPDATE users 
        SET password = ?, role = 'admin', status = 'active', balance = 10000, updated_at = NOW()
        WHERE id = ?
      `, { replacements: [hashedPassword, adminUserId] });
    } else {
      console.log('Creating new admin user...');
      adminUserId = adminId;
      await sequelize.query(`
        INSERT INTO users (id, email, password, first_name, last_name, username, phone, role, status, balance, created_at, updated_at)
        VALUES (?, ?, ?, 'Admin', 'User', 'admin', '+1234567890', 'admin', 'active', 10000, NOW(), NOW())
      `, { replacements: [adminUserId, adminEmail, hashedPassword] });
    }

    // Assign RBAC role to admin
    await sequelize.query(`
      INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
      VALUES (?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE updated_at = NOW()
    `, { replacements: [adminUserId, adminRole.id] });

    console.log(`✅ Admin user: ${adminEmail} / ${password}`);
    console.log(`   Role: ${adminRole.label}`);
    console.log('');

    // Create Moderator user
    const moderatorId = uuidv4();
    const moderatorEmail = 'moderator@gmail.com';
    
    // Check if moderator user exists
    const [existingModerator] = await sequelize.query(`
      SELECT id FROM users WHERE email = ?
    `, { replacements: [moderatorEmail] });

    let moderatorUserId;
    if (existingModerator.length > 0) {
      console.log('⚠️  Moderator user already exists, updating...');
      moderatorUserId = existingModerator[0].id;
      await sequelize.query(`
        UPDATE users 
        SET password = ?, role = 'moderator', status = 'active', balance = 5000, updated_at = NOW()
        WHERE id = ?
      `, { replacements: [hashedPassword, moderatorUserId] });
    } else {
      console.log('Creating new moderator user...');
      moderatorUserId = moderatorId;
      await sequelize.query(`
        INSERT INTO users (id, email, password, first_name, last_name, username, phone, role, status, balance, created_at, updated_at)
        VALUES (?, ?, ?, 'Moderator', 'User', 'moderator', '+1234567891', 'moderator', 'active', 5000, NOW(), NOW())
      `, { replacements: [moderatorUserId, moderatorEmail, hashedPassword] });
    }

    // Assign RBAC role to moderator
    await sequelize.query(`
      INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
      VALUES (?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE updated_at = NOW()
    `, { replacements: [moderatorUserId, moderatorRole.id] });

    console.log(`✅ Moderator user: ${moderatorEmail} / ${password}`);
    console.log(`   Role: ${moderatorRole.label}`);
    console.log('');

    // Verify permissions
    const [adminPerms] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      WHERE ur.user_id = ? AND rp.allow = 1
    `, { replacements: [adminUserId] });

    const [modPerms] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      WHERE ur.user_id = ? AND rp.allow = 1
    `, { replacements: [moderatorUserId] });

    console.log('📊 Verification:');
    console.log(`   Admin has ${adminPerms[0].count} permissions`);
    console.log(`   Moderator has ${modPerms[0].count} permissions`);
    console.log('');

    console.log('✅ All users created/updated successfully!');
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('');
    console.log('Admin:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('Moderator:');
    console.log(`   Email: ${moderatorEmail}`);
    console.log(`   Password: ${password}`);
    console.log('');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createUsers();
