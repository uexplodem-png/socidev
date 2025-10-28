const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import the database config to initialize Sequelize
const { sequelize } = require('../src/config/database.js');
const { settingsService } = require('../src/services/settingsService.js');

async function testSettingsService() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Test 1: Set a general setting
    console.log('🧪 Test 1: Set general settings...');
    const generalSettings = {
      siteName: 'SociDev Test',
      maintenanceMode: false,
      registrationEnabled: true,
      emailNotifications: true,
      maxTasksPerUser: 10,
      minWithdrawalAmount: 10,
      withdrawalFee: 0
    };

    await settingsService.set('general', generalSettings, 'test-user-id', 'Test general settings');
    console.log('✅ General settings set');

    // Test 2: Get the setting back
    console.log('\n🧪 Test 2: Get general settings...');
    const retrieved = await settingsService.get('general');
    console.log('Retrieved value:');
    console.log(JSON.stringify(retrieved, null, 2));

    if (retrieved && retrieved.siteName === 'SociDev Test') {
      console.log('✅ Settings retrieved correctly!');
    } else {
      console.log('❌ Settings not retrieved correctly');
      console.log('Expected siteName: "SociDev Test"');
      console.log('Got:', retrieved);
    }

    // Test 3: Set modes
    console.log('\n🧪 Test 3: Set modes settings...');
    const modesSettings = {
      defaultMode: 'taskDoer',
      allowModeSwitching: true,
      taskDoerEnabled: true,
      taskGiverEnabled: true,
      requireVerificationForGiver: false,
      minBalanceForGiver: 0
    };

    await settingsService.set('modes', modesSettings, 'test-user-id', 'Test modes settings');
    console.log('✅ Modes settings set');

    // Test 4: Get modes back
    console.log('\n🧪 Test 4: Get modes settings...');
    const retrievedModes = await settingsService.get('modes');
    console.log('Retrieved modes:');
    console.log(JSON.stringify(retrievedModes, null, 2));

    if (retrievedModes && retrievedModes.defaultMode === 'taskDoer') {
      console.log('✅ Modes retrieved correctly!');
    } else {
      console.log('❌ Modes not retrieved correctly');
    }

    // Test 5: List all settings
    console.log('\n🧪 Test 5: List all settings...');
    const allSettings = await settingsService.list();
    console.log(`Total settings: ${allSettings.length}`);
    allSettings.forEach(s => {
      console.log(`  - ${s.key}: ${typeof s.value} (${Object.keys(s.value || {}).length} properties)`);
    });

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

testSettingsService();
