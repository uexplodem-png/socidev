import { Sequelize } from 'sequelize';
import logger from './logger.js';

// Database configuration
const config = {
  development: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'social_developer',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? (msg) => logger.debug(msg) : false,
    define: {
      timestamps: true,
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    timezone: '+00:00',
  },
  test: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'social_developer_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    timezone: '+00:00',
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    timezone: '+00:00',
  }
};

// Get environment
const env = process.env.NODE_ENV || 'development';

// Create Sequelize instance
const dbConfig = config[env];
const sequelizeConfig = {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
  define: dbConfig.define,
  timezone: dbConfig.timezone
};

// Add storage for SQLite
if (dbConfig.dialect === 'sqlite') {
  sequelizeConfig.storage = dbConfig.storage;
}

export const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  sequelizeConfig
);

// Test database connection
export const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully');
    
    // Run migrations automatically using the CLI command
    try {
      logger.info('🔄 Running database migrations...');
      
      // Use a simple approach with exec to run the migration command
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execPromise = promisify(exec);
      
      const { stdout, stderr } = await execPromise('npx sequelize-cli --config src/config/config.cjs db:migrate', {
        cwd: process.cwd()
      });
      
      if (stderr) {
        logger.warn('Migration warnings:', stderr);
      }
      
      logger.info('✅ Database migrations completed successfully');
      if (stdout) {
        logger.debug('Migration output:', stdout);
      }
    } catch (migrationError) {
      logger.error('❌ Error running migrations:', migrationError);
      // Don't throw the error to allow the server to start even if migrations fail
      logger.warn('⚠️  Continuing server startup despite migration error');
    }
    
    // Skip model sync in development since migrations have been applied
    // Sync models in development only if needed for development purposes
    if (process.env.NODE_ENV === 'development') {
      // Only sync if there are no existing tables or if forced
      // await sequelize.sync({ alter: true });
      logger.info('📊 Skipping model synchronization in development (migrations already applied)');
    }
  } catch (error) {
    logger.error('❌ Unable to connect to database:', error);
    throw error;
  }
};

// Close database connection
export const closeDatabase = async () => {
  try {
    await sequelize.close();
    logger.info('🔒 Database connection closed');
  } catch (error) {
    logger.error('❌ Error closing database connection:', error);
    throw error;
  }
};

export default config;