import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '../src/config/database.js';
import User from '../src/models/User.js';
import Role from '../src/models/Role.js';
import UserRole from '../src/models/UserRole.js';
import logger from '../src/config/logger.js';

/**
 * Assign super_admin role to a user by email
 * Usage: node scripts/assign-superadmin.js user@example.com
 */
async function assignSuperAdmin() {
  try {
    await connectDatabase();
    
    // Get email from command line argument
    const email = process.argv[2];
    
    if (!email) {
      console.error('❌ Usage: node scripts/assign-superadmin.js user@example.com');
      process.exit(1);
    }
    
    // Find user
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'firstName', 'lastName', 'username', 'role']
    });
    
    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      process.exit(1);
    }
    
    console.log(`\n📧 Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`   Current role field: ${user.role}`);
    
    // Find super_admin role
    const superAdminRole = await Role.findOne({
      where: { key: 'super_admin' },
      attributes: ['id', 'key', 'label']
    });
    
    if (!superAdminRole) {
      console.error('❌ super_admin role not found in database!');
      console.log('\n💡 Run: node scripts/init-database.js to initialize roles');
      process.exit(1);
    }
    
    // Check if already assigned
    const existing = await UserRole.findOne({
      where: {
        user_id: user.id,
        role_id: superAdminRole.id
      }
    });
    
    if (existing) {
      console.log(`\n✅ User already has super_admin role assigned!`);
    } else {
      // Assign the role
      await UserRole.create({
        user_id: user.id,
        role_id: superAdminRole.id
      });
      console.log(`\n✅ Successfully assigned super_admin role to user!`);
    }
    
    // Also update the role field in users table for compatibility
    if (user.role !== 'super_admin') {
      await user.update({ role: 'super_admin' });
      console.log(`✅ Updated user.role field to 'super_admin'`);
    }
    
    // Verify the assignment
    const userRoles = await UserRole.findAll({
      where: { user_id: user.id },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['key', 'label']
        }
      ]
    });
    
    console.log(`\n📋 User's roles:`);
    userRoles.forEach(ur => {
      console.log(`   - ${ur.role.label} (${ur.role.key})`);
    });
    
    console.log(`\n🎉 Done! User can now login and access admin panel.`);
    console.log(`\n💡 If already logged in, user needs to logout and login again to get new permissions.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignSuperAdmin();
