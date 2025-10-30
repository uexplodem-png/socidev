// Production environment configuration
export const ENV = {
    // API Configuration
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',

    // App Configuration
    APP_NAME: 'SociDev',
    APP_VERSION: '1.0.0',

    // Security
    ENCRYPTION_ALGORITHM: 'aes-256-cbc',

    // Instagram Bot Settings
    INSTAGRAM_MAX_ACTIONS_PER_HOUR: 30,
    INSTAGRAM_MIN_DELAY: 2000,
    INSTAGRAM_MAX_DELAY: 8000,

    // Development
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
    IS_PRODUCTION: process.env.NODE_ENV === 'production',

    // Logging
    ENABLE_CONSOLE_LOGS: process.env.NODE_ENV === 'development',
    ENABLE_FILE_LOGS: true,
};

// Logger wrapper for production
export const logger = {
    log: (...args: any[]) => {
        if (ENV.ENABLE_CONSOLE_LOGS) {
            console.log(...args);
        }
    },
    error: (...args: any[]) => {
        console.error(...args); // Always log errors
    },
    warn: (...args: any[]) => {
        if (ENV.ENABLE_CONSOLE_LOGS) {
            console.warn(...args);
        }
    },
    info: (...args: any[]) => {
        if (ENV.ENABLE_CONSOLE_LOGS) {
            console.info(...args);
        }
    },
};
