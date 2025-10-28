import { SystemSettings } from '../models/index.js';
import logger from '../config/logger.js';

class SettingsService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 60000; // 60 seconds
  }

  /**
   * Get a single setting by key
   * @param {string} key - Setting key
   * @param {*} defaultValue - Default value if not found
   * @returns {Promise<*>} Setting value or default
   */
  async get(key, defaultValue = null) {
    try {
      // Check cache first
      const cached = this._getFromCache(key);
      if (cached !== undefined) {
        return cached;
      }

      // Fetch from DB (without raw to let Sequelize parse JSON)
      const setting = await SystemSettings.findOne({
        where: { key },
        attributes: ['key', 'value']
      });

      if (!setting) {
        return defaultValue;
      }

      // Get the value - Sequelize should have already parsed the JSON
      let value = setting.value;
      
      // If it's still a string, parse it manually (fallback for MariaDB/MySQL)
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // If parsing fails, return as-is
          logger.warn(`Failed to parse JSON for setting ${key}:`, e.message);
        }
      }
      
      // Cache the result
      this._setCache(key, value);
      
      return value;
    } catch (error) {
      logger.error(`SettingsService.get error for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get multiple settings by keys
   * @param {string[]} keys - Array of setting keys
   * @returns {Promise<Object>} Object with key-value pairs
   */
  async getMany(keys) {
    try {
      const result = {};
      const keysToFetch = [];

      // Check cache first
      for (const key of keys) {
        const cached = this._getFromCache(key);
        if (cached !== undefined) {
          result[key] = cached;
        } else {
          keysToFetch.push(key);
        }
      }

      // Fetch missing keys from DB
      if (keysToFetch.length > 0) {
        const settings = await SystemSettings.findAll({
          where: { key: keysToFetch },
          attributes: ['key', 'value'],
          raw: true
        });

        for (const setting of settings) {
          result[setting.key] = setting.value;
          this._setCache(setting.key, setting.value);
        }
      }

      return result;
    } catch (error) {
      logger.error('SettingsService.getMany error:', error);
      return {};
    }
  }

  /**
   * Set a setting value
   * @param {string} key - Setting key
   * @param {*} value - Setting value (will be stored as JSON)
   * @param {string} actorId - User ID making the change
   * @param {string} description - Optional description
   * @returns {Promise<Object>} Updated setting
   */
  async set(key, value, actorId, description = null) {
    try {
      // Value is already an object, store it directly
      // Sequelize will handle JSON serialization for DataTypes.JSON fields
      const [setting, created] = await SystemSettings.upsert({
        key,
        value: value, // Store value directly, Sequelize handles JSON serialization
        description,
        updated_by: actorId
      }, {
        returning: true
      });

      // Invalidate cache
      this._invalidateCache(key);

      logger.info(`Setting ${key} ${created ? 'created' : 'updated'} by ${actorId}`);
      
      return setting;
    } catch (error) {
      logger.error(`SettingsService.set error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * List all settings
   * @returns {Promise<Array>} All settings
   */
  async list() {
    try {
      const settings = await SystemSettings.findAll({
        attributes: ['key', 'value', 'description', 'updated_by', 'updated_at'],
        order: [['key', 'ASC']]
      });

      // Parse JSON values if they're strings (fallback for MariaDB/MySQL)
      return settings.map(setting => {
        let value = setting.value;
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value);
          } catch (e) {
            logger.warn(`Failed to parse JSON for setting ${setting.key}:`, e.message);
          }
        }
        
        return {
          key: setting.key,
          value: value,
          description: setting.description,
          updated_by: setting.updated_by,
          updated_at: setting.updated_at
        };
      });
    } catch (error) {
      logger.error('SettingsService.list error:', error);
      return [];
    }
  }

  /**
   * Delete a setting
   * @param {string} key - Setting key
   * @returns {Promise<boolean>} Success status
   */
  async delete(key) {
    try {
      const deleted = await SystemSettings.destroy({
        where: { key }
      });

      if (deleted) {
        this._invalidateCache(key);
        logger.info(`Setting ${key} deleted`);
      }

      return deleted > 0;
    } catch (error) {
      logger.error(`SettingsService.delete error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear entire settings cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Settings cache cleared');
  }

  /**
   * Get value from cache
   * @private
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return undefined;

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return cached.value;
  }

  /**
   * Set value in cache
   * @private
   */
  _setCache(key, value) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.cacheTTL
    });
  }

  /**
   * Invalidate cache entry
   * @private
   */
  _invalidateCache(key) {
    this.cache.delete(key);
  }
}

// Export singleton instance
export const settingsService = new SettingsService();
export default settingsService;
