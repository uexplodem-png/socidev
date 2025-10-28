import { sequelize } from '../src/config/database.js';
import '../src/models/index.js';

async function syncDatabase() {
  try {
    console.log('🔄 Starting database synchronization...');
    console.log('⚠️  WARNING: This will DROP all existing tables and recreate them!');
    
    // Force sync - this will drop all tables and recreate them
    await sequelize.sync({ force: true });
    
    console.log('✅ Database synchronized successfully!');
    console.log('📋 All tables have been recreated based on current models.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    process.exit(1);
  }
}

syncDatabase();
