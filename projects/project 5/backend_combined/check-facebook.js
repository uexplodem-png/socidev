import { sequelize } from './src/config/database.js';
import { Platform } from './src/models/index.js';

async function checkFacebook() {
  try {
    // Find facebook by name (case-insensitive)
    const facebook = await Platform.findAll({
      where: { name: 'facebook' },
      raw: true
    });
    
    console.log('Facebook records found:', facebook);
    
    // Check all platforms
    const all = await Platform.findAll({ raw: true });
    console.log('\nAll platforms:');
    all.forEach(p => console.log(`  - ${p.name}: isActive=${p.is_active}, displayOrder=${p.display_order}`));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkFacebook();
