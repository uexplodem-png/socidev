/**
 * Script to assign super_admin role to a user
 * Usage: node scripts/assign-super-admin.js <email>
 * Example: node scripts/assign-super-admin.js superadmin@gmail.com
 */

import { sequelize } from '../src/config/database.js';
import { User, Role, UserRole } from '../src/models/index.js';

const assignSuperAdmin = async (email) => {
  try {
    // Find the user
    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`);

    // Find super_admin role
    const superAdminRole = await Role.findOne({
      where: { key: 'super_admin' },
      attributes: ['id', 'key', 'label'],
    });

    if (!superAdminRole) {
      console.error('❌ super_admin role not found in database. Run migrations first.');
      process.exit(1);
    }

    console.log(`✅ Found role: ${superAdminRole.label} (${superAdminRole.key})`);

    // Check if user already has this role
    const existingUserRole = await UserRole.findOne({
      where: {
        user_id: user.id,
        role_id: superAdminRole.id,
      },
    });

    if (existingUserRole) {
      console.log(`⚠️  User already has super_admin role`);
      process.exit(0);
    }

    // Assign the role
    await UserRole.create({
      user_id: user.id,
      role_id: superAdminRole.id,
    });

    console.log(`✅ Successfully assigned super_admin role to ${user.firstName} ${user.lastName}`);
    console.log(`\n🎉 Done! User now has super_admin permissions.`);

    // Show assigned roles
    const userRoles = await UserRole.findAll({
      where: { user_id: user.id },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['key', 'label'],
      }],
    });

    console.log('\nAssigned roles:');
    userRoles.forEach(ur => {
      console.log(`  - ${ur.role.label} (${ur.role.key})`);
    });

  } catch (error) {
    console.error('❌ Error assigning super_admin role:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: node scripts/assign-super-admin.js <email>');
  console.error('   Example: node scripts/assign-super-admin.js superadmin@gmail.com');
  process.exit(1);
}

assignSuperAdmin(email);
