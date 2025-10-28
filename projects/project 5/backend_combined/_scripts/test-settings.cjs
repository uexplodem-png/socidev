const { Sequelize, DataTypes } = require('sequelize');
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

async function testSettings() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Get all settings
    const [settings] = await sequelize.query(`
      SELECT \`key\`, value, description, updated_by, updated_at
      FROM system_settings
      ORDER BY \`key\`;
    `);

    console.log(`📋 Current Settings (${settings.length} total):\n`);
    
    if (settings.length === 0) {
      console.log('❌ No settings found in database!');
      console.log('\n💡 This explains why settings return empty.');
      console.log('   Settings need to be initialized in the database.\n');
    } else {
      settings.forEach(s => {
        console.log(`Key: ${s.key}`);
        console.log(`Value: ${JSON.stringify(s.value, null, 2)}`);
        console.log(`Updated: ${s.updated_at || 'never'}`);
        console.log(`Updated by: ${s.updated_by || 'system'}`);
        console.log('---');
      });
    }

    // Test inserting a setting
    console.log('\n🧪 Testing setting insertion...');
    
    const testValue = {
      siteName: 'SociDev',
      maintenanceMode: false,
      registrationEnabled: true,
      emailNotifications: true,
      maxTasksPerUser: 10,
      minWithdrawalAmount: 10,
      withdrawalFee: 0
    };

    await sequelize.query(`
      INSERT INTO system_settings (\`key\`, value, description, updated_at, created_at)
      VALUES ('general', :value, 'General system settings', NOW(), NOW())
      ON DUPLICATE KEY UPDATE value = :value, updated_at = NOW();
    `, {
      replacements: { value: JSON.stringify(testValue) }
    });

    console.log('✅ Test setting inserted/updated');

    // Read it back
    const [result] = await sequelize.query(`
      SELECT \`key\`, value FROM system_settings WHERE \`key\` = 'general';
    `);

    if (result.length > 0) {
      console.log('\n📖 Reading back the setting:');
      console.log(`Key: ${result[0].key}`);
      console.log(`Value: ${JSON.stringify(result[0].value, null, 2)}`);
      console.log('\n✅ Settings storage is working correctly!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

testSettings();
