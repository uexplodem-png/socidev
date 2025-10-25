import { sequelize } from './src/config/database.js';
import { Platform } from './src/models/index.js';

async function checkPlatforms() {
  try {
    // Get all with findAll (no filtering)
    const all = await Platform.findAll({
      order: [['displayOrder', 'ASC']],
      raw: true
    });
    
    console.log('Total platforms found:', all.length);
    all.forEach(p => {
      console.log(`  - ${p.name}: id=${p.id}, isActive=${p.is_active}`);
    });
    
    // Now try what the API does
    const { count, rows } = await Platform.findAndCountAll({
      where: {},
      offset: 0,
      limit: 100,
      order: [['displayOrder', 'ASC']],
    });
    
    console.log('\nWith findAndCountAll:');
    console.log('  Count:', count);
    console.log('  Rows:', rows.length);
    rows.forEach(p => {
      console.log(`    - ${p.name}: isActive=${p.isActive}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkPlatforms();
