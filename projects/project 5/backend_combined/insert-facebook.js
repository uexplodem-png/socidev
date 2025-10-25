import { sequelize } from './src/config/database.js';
import { Platform } from './src/models/index.js';

async function insertFacebook() {
  try {
    // Insert Facebook platform
    const facebook = await Platform.create({
      name: 'facebook',
      nameEn: 'Facebook',
      nameTr: 'Facebook',
      description: 'Facebook Social Media',
      descriptionEn: 'Facebook',
      descriptionTr: 'Facebook',
      icon: 'facebook',
      isActive: true,
      displayOrder: 1
    });
    
    console.log('✅ Facebook platform created:', facebook.toJSON());
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

insertFacebook();
