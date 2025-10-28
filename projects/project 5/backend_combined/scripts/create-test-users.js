import bcrypt from 'bcryptjs';
import { sequelize } from '../src/config/database.js';
import User from '../src/models/User.js';

async function createTestUsers() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Hash the password
    const password = 'Meva1618';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Users to create
    const users = [
      {
        email: 'superadmin@gmail.com',
        username: 'superadmin',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        userMode: 'taskGiver',
        balance: 10000,
        status: 'active',
        phone: '+1234567890'
      },
      {
        email: 'taskdoer@gmail.com',
        username: 'taskdoer',
        password: hashedPassword,
        firstName: 'Task',
        lastName: 'Doer',
        role: 'task_doer',
        userMode: 'taskDoer',
        balance: 500,
        status: 'active',
        phone: '+1234567891'
      },
      {
        email: 'taskgiver@gmail.com',
        username: 'taskgiver',
        password: hashedPassword,
        firstName: 'Task',
        lastName: 'Giver',
        role: 'task_giver',
        userMode: 'taskGiver',
        balance: 5000,
        status: 'active',
        phone: '+1234567892'
      }
    ];

    console.log('\n🔄 Creating test users...\n');

    for (const userData of users) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          where: { email: userData.email } 
        });

        if (existingUser) {
          console.log(`⚠️  User ${userData.email} already exists, updating...`);
          await existingUser.update({
            password: hashedPassword,
            balance: userData.balance,
            status: 'active',
            role: userData.role,
            userMode: userData.userMode
          });
          console.log(`✅ Updated: ${userData.email} (${userData.role})`);
        } else {
          const user = await User.create(userData);
          console.log(`✅ Created: ${userData.email} (${userData.role})`);
        }
      } catch (error) {
        console.error(`❌ Error creating ${userData.email}:`, error.message);
      }
    }

    console.log('\n📋 Test Users Summary:');
    console.log('═'.repeat(60));
    console.log('Super Admin:');
    console.log('  Email: superadmin@gmail.com');
    console.log('  Password: Meva1618');
    console.log('  Role: super_admin');
    console.log('  Balance: ₺10,000');
    console.log('');
    console.log('Task Doer:');
    console.log('  Email: taskdoer@gmail.com');
    console.log('  Password: Meva1618');
    console.log('  Mode: taskDoer');
    console.log('  Balance: ₺500');
    console.log('');
    console.log('Task Giver:');
    console.log('  Email: taskgiver@gmail.com');
    console.log('  Password: Meva1618');
    console.log('  Mode: taskGiver');
    console.log('  Balance: ₺5,000');
    console.log('═'.repeat(60));
    console.log('✅ All test users created successfully!');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestUsers();
