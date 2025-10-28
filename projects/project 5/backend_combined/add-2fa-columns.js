// Quick script to add 2FA columns to users table
import { sequelize } from './src/config/database.js';

async function addColumns() {
  try {
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
      ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT,
      ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS email_verification_expires DATETIME,
      ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS password_reset_expires DATETIME,
      ADD COLUMN IF NOT EXISTS locked_until DATETIME;
    `);
    
    console.log('✅ Successfully added 2FA columns');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addColumns();
