import { sequelize } from './src/config/database.js';
import { Platform } from './src/models/index.js';

async function updateFacebook() {
  try {
    // Update Facebook to be inactive
    await Platform.update(
      { isActive: false },
      { where: { name: 'facebook' } }
    );
    
    // Check the result
    const facebook = await Platform.findOne({
      where: { name: 'facebook' }
    });
    
    console.log('✅ Facebook set to inactive:', facebook.toJSON());
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateFacebook();
