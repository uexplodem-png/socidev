import { sequelize } from '../src/config/database.js';
import '../src/models/index.js';

async function recreateDatabase() {
  try {
    console.log('🔄 Dropping all tables and recreating from models...');
    
    // Force sync - drops all tables and recreates them from models
    await sequelize.sync({ force: true });
    
    console.log('✅ Database recreated successfully!');
    console.log('📋 All tables are now in sync with your models.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

recreateDatabase();
