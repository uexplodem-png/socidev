import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '../src/config/database.js';
import { reinitializeDatabase } from '../src/utils/initializeDatabase.js';
import logger from '../src/config/logger.js';

/**
 * Manual script to reinitialize database with permissions, roles, and settings
 * Run: node scripts/init-database.js
 */
async function main() {
  try {
    logger.info('🔄 Connecting to database...');
    await connectDatabase();
    
    logger.info('🔄 Reinitializing database...');
    await reinitializeDatabase();
    
    logger.info('✅ Database reinitialized successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Failed to reinitialize database:', error);
    process.exit(1);
  }
}

main();
