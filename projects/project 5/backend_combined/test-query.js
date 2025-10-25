import { sequelize } from './src/config/database.js';
import { Platform } from './src/models/index.js';

async function testQuery() {
  try {
    // Exact same query as the API
    const { count, rows } = await Platform.findAndCountAll({
      where: {},
      offset: 0,
      limit: 1000,
      order: [['displayOrder', 'ASC']],
    });
    
    console.log('Count:', count);
    console.log('Rows count:', rows.length);
    console.log('Rows:');
    rows.forEach(p => console.log(`  ${p.name}: ${p.isActive}`));
    
    // Also test raw query
    const raw = await sequelize.query('SELECT * FROM platforms ORDER BY display_order ASC');
    console.log('\nRaw query result:');
    console.log('Rows:', raw[0].length);
    raw[0].forEach(p => console.log(`  ${p.name}: is_active=${p.is_active}`));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testQuery();
