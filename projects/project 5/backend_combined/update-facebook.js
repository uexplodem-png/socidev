import { sequelize } from './src/config/database.js';
import { Platform } from './src/models/index.js';

async function updateFacebook() {
  try {
    // Find and update Facebook
    await Platform.update(
      { isActive: true, displayOrder: 1 },
      { where: { name: 'facebook' } }
    );
    
    // Check the result
    const facebook = await Platform.findOne({
      where: { name: 'facebook' }
    });
    
    console.log('✅ Facebook updated:', facebook.toJSON());
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateFacebook();
