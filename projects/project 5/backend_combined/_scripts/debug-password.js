import bcrypt from 'bcryptjs';
import { sequelize } from '../src/config/database.js';
import User from '../src/models/User.js';

async function debugPassword() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    const email = 'superadmin@gmail.com';
    
    // Fetch user with ALL fields
    console.log('📋 Fetching user with all fields...');
    const user = await User.findOne({ 
      where: { email },
      attributes: { exclude: [] } // Get ALL fields including password
    });
    
    if (!user) {
      console.log('❌ User not found');
      await sequelize.close();
      return;
    }

    console.log('\n✅ User object:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Username:', user.username);
    console.log('   Has password field:', 'password' in user);
    console.log('   Password value:', user.password);
    console.log('   Password type:', typeof user.password);
    console.log('   Password length:', user.password?.length);
    
    // Get raw database value
    console.log('\n📊 Checking raw database value...');
    const [results] = await sequelize.query(
      'SELECT id, email, username, password FROM users WHERE email = ?',
      { replacements: [email] }
    );
    
    if (results && results[0]) {
      console.log('   DB Password:', results[0].password);
      console.log('   DB Password length:', results[0].password?.length);
      console.log('   DB Password type:', typeof results[0].password);
    }
    
    // Test password
    const testPassword = 'Meva1618';
    console.log('\n🧪 Testing password:', testPassword);
    
    if (user.password) {
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log('   bcrypt.compare result:', isValid);
      
      // Test with raw DB password
      if (results && results[0] && results[0].password) {
        const isValidRaw = await bcrypt.compare(testPassword, results[0].password);
        console.log('   bcrypt.compare (raw DB) result:', isValidRaw);
      }
    } else {
      console.log('   ❌ No password field available');
    }
    
    // Create a fresh hash and test
    console.log('\n🔄 Creating fresh hash...');
    const salt = await bcrypt.genSalt(10);
    const freshHash = await bcrypt.hash(testPassword, salt);
    console.log('   Fresh hash:', freshHash);
    console.log('   Fresh hash length:', freshHash.length);
    
    const testFresh = await bcrypt.compare(testPassword, freshHash);
    console.log('   Fresh hash validates:', testFresh);
    
    // Update user with fresh hash
    console.log('\n💾 Updating user with fresh hash...');
    await sequelize.query(
      'UPDATE users SET password = ? WHERE email = ?',
      { replacements: [freshHash, email] }
    );
    console.log('   ✅ Updated');
    
    // Re-fetch and test
    const updatedUser = await User.findOne({ 
      where: { email },
      attributes: { exclude: [] }
    });
    
    console.log('\n🔄 Testing updated user...');
    const finalTest = await bcrypt.compare(testPassword, updatedUser.password);
    console.log('   Final test result:', finalTest);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

debugPassword();
