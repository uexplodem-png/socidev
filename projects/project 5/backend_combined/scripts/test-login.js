import bcrypt from 'bcryptjs';
import { sequelize } from '../src/config/database.js';
import User from '../src/models/User.js';

async function testLogin() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    const testPassword = 'Meva1618';
    const testUsers = [
      'superadmin@gmail.com',
      'taskdoer@gmail.com',
      'taskgiver@gmail.com'
    ];

    for (const email of testUsers) {
      console.log(`\n🔍 Testing: ${email}`);
      console.log('═'.repeat(60));
      
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        console.log('❌ User not found in database');
        continue;
      }

      console.log('✅ User found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Password hash length: ${user.password?.length || 0}`);
      
      // Test password validation
      try {
        const isValid = await user.validatePassword(testPassword);
        console.log(`\n🔐 Password validation: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
        
        // Also test with bcrypt.compare directly
        const directCompare = await bcrypt.compare(testPassword, user.password);
        console.log(`🔐 Direct bcrypt.compare: ${directCompare ? '✅ PASS' : '❌ FAIL'}`);
        
        if (!isValid) {
          console.log('\n⚠️  Re-hashing password...');
          const salt = await bcrypt.genSalt(10);
          const newHash = await bcrypt.hash(testPassword, salt);
          await user.update({ password: newHash });
          
          const retestValid = await user.validatePassword(testPassword);
          console.log(`🔐 After re-hash: ${retestValid ? '✅ PASS' : '❌ FAIL'}`);
        }
      } catch (error) {
        console.log(`❌ Error validating password: ${error.message}`);
      }
    }

    console.log('\n\n🧪 Testing API Login Endpoint...');
    console.log('═'.repeat(60));
    
    const http = await import('http');
    
    for (const email of testUsers) {
      const postData = JSON.stringify({
        email: email,
        password: testPassword
      });

      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      console.log(`\n📡 Testing login API for: ${email}`);
      
      await new Promise((resolve) => {
        const req = http.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              if (res.statusCode === 200) {
                console.log(`✅ Login successful!`);
                console.log(`   Token: ${response.data?.token?.substring(0, 20)}...`);
                console.log(`   User ID: ${response.data?.user?.id}`);
                console.log(`   Role: ${response.data?.user?.role}`);
              } else {
                console.log(`❌ Login failed with status ${res.statusCode}`);
                console.log(`   Error: ${response.error || response.message}`);
              }
            } catch (error) {
              console.log(`❌ Failed to parse response: ${error.message}`);
            }
            resolve();
          });
        });

        req.on('error', (error) => {
          console.log(`❌ Request error: ${error.message}`);
          resolve();
        });

        req.write(postData);
        req.end();
      });
    }

    console.log('\n✅ Test completed!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

testLogin();
