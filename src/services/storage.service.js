/**
 * @fileoverview Secure LocalStorage wrapper with versioning, validation, and migration.
 * All data is JSON-serialized and validated before storage.
 * @module StorageService
 */

import { STORAGE_KEYS, CURRENT_SCHEMA_VERSION, MAX_STORAGE_BYTES } from '../utils/constants.js';

/**
 * @class StorageService
 * @description Provides a secure interface to localStorage with type safety,
 * schema versioning, and storage size management.
 */
class StorageService {
  constructor() {
    this._available = this._checkAvailability();
    if (this._available) {
      this._migrateIfNeeded();
    }
  }

  /**
   * Checks if localStorage is available and writable.
   * @returns {boolean} True if localStorage works.
   * @private
   */
  _checkAvailability() {
    try {
      const testKey = '__cw_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      console.warn('StorageService: localStorage is not available. Data will not persist.');
      return false;
    }
  }

  /**
   * Runs schema migrations when needed.
   * @private
   */
  _migrateIfNeeded() {
    const storedVersion = this._getRaw(STORAGE_KEYS.SCHEMA_VERSION);
    const currentVersion = storedVersion ? parseInt(storedVersion, 10) : 0;

    if (currentVersion < CURRENT_SCHEMA_VERSION) {
      // Migration logic for future schema changes
      this._setRaw(STORAGE_KEYS.SCHEMA_VERSION, String(CURRENT_SCHEMA_VERSION));
    }
  }

  /**
   * Gets a raw string value from localStorage.
   * @param {string} key - Storage key.
   * @returns {string|null} Raw stored value.
   * @private
   */
  _getRaw(key) {
    if (!this._available) {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`StorageService: Failed to read key "${key}"`, error);
      return null;
    }
  }

  /**
   * Sets a raw string value in localStorage.
   * @param {string} key - Storage key.
   * @param {string} value - Value to store.
   * @returns {boolean} True if successful.
   * @private
   */
  _setRaw(key, value) {
    if (!this._available) {
      return false;
    }
    try {
      // Check size before writing
      if (value.length > MAX_STORAGE_BYTES) {
        console.error('StorageService: Data exceeds maximum storage size.');
        return false;
      }
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('StorageService: Storage quota exceeded.');
      } else {
        console.error(`StorageService: Failed to write key "${key}"`, error);
      }
      return false;
    }
  }

  /**
   * Retrieves and parses a JSON value from storage.
   * @template T
   * @param {string} key - Storage key (should be from STORAGE_KEYS).
   * @param {T} [defaultValue=null] - Default value if key doesn't exist.
   * @returns {T} Parsed value or default.
   */
  get(key, defaultValue = null) {
    const raw = this._getRaw(key);
    if (raw === null) {
      return defaultValue;
    }
    try {
      return JSON.parse(raw);
    } catch {
      console.warn(`StorageService: Invalid JSON for key "${key}", returning default.`);
      return defaultValue;
    }
  }

  /**
   * Serializes and stores a value as JSON.
   * @param {string} key - Storage key (should be from STORAGE_KEYS).
   * @param {*} value - Value to store (must be JSON-serializable).
   * @returns {boolean} True if successful.
   */
  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      return this._setRaw(key, serialized);
    } catch (error) {
      console.error(`StorageService: Failed to serialize value for key "${key}"`, error);
      return false;
    }
  }

  /**
   * Removes a key from storage.
   * @param {string} key - Storage key to remove.
   * @returns {boolean} True if successful.
   */
  remove(key) {
    if (!this._available) {
      return false;
    }
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`StorageService: Failed to remove key "${key}"`, error);
      return false;
    }
  }

  /**
   * Clears all CarbonWise data from storage.
   * Only removes keys with the 'cw_' prefix for safety.
   * @returns {boolean} True if successful.
   */
  clearAll() {
    if (!this._available) {
      return false;
    }
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cw_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('StorageService: Failed to clear storage', error);
      return false;
    }
  }

  /**
   * Calculates approximate total size of CarbonWise data in storage.
   * @returns {number} Size in bytes.
   */
  getUsedBytes() {
    if (!this._available) {
      return 0;
    }
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cw_')) {
        const value = localStorage.getItem(key);
        totalBytes += (key.length + (value ? value.length : 0)) * 2; // UTF-16
      }
    }
    return totalBytes;
  }

  /**
   * Checks if storage is available.
   * @returns {boolean} True if localStorage is accessible.
   */
  isAvailable() {
    return this._available;
  }
}

/** Singleton storage instance. */
export const storageService = new StorageService();
