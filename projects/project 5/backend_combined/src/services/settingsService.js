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

      // Try exact key match first (without raw to let Sequelize parse JSON)
      const exact = await SystemSettings.findOne({
        where: { key },
        attributes: ['key', 'value']
      });

      if (exact) {
        let value = exact.value;
        if (typeof value === 'string') {
          try { value = JSON.parse(value); } catch (e) { logger.warn(`Failed to parse JSON for setting ${key}:`, e.message); }
        }
        this._setCache(key, value);
        return value;
      }

      // If not found and key is dotted (e.g., "security.requireEmailVerification"),
      // load the root object (e.g., key "security") and resolve the nested path
      if (key.includes('.')) {
        const [rootKey, ...pathParts] = key.split('.');
        const root = await SystemSettings.findOne({
          where: { key: rootKey },
          attributes: ['key', 'value']
        });

        if (root) {
          let rootValue = root.value;
          if (typeof rootValue === 'string') {
            try { rootValue = JSON.parse(rootValue); } catch (e) { logger.warn(`Failed to parse JSON for setting ${rootKey}:`, e.message); }
          }

          // Resolve nested path safely
          const nested = this._resolvePath(rootValue, pathParts);
          if (nested !== undefined) {
            // Cache the nested value under the full dotted key for fast subsequent access
            this._setCache(key, nested);
            return nested;
          }
        }
      }

      return defaultValue;
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

  /**
   * Resolve a nested value from an object via path parts
   * @private
   */
  _resolvePath(obj, parts) {
    try {
      return parts.reduce((acc, part) => (acc != null ? acc[part] : undefined), obj);
    } catch (_) {
      return undefined;
    }
  }
}

// Export singleton instance
export const settingsService = new SettingsService();
export default settingsService;
