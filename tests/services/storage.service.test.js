/**
 * @fileoverview Unit tests for storage service.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '../../src/services/storage.service.js';

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isAvailable', () => {
    it('should report localStorage as available', () => {
      expect(storageService.isAvailable()).toBe(true);
    });
  });

  describe('get/set', () => {
    it('should store and retrieve an object', () => {
      storageService.set('test_key', { name: 'Test', value: 42 });
      const result = storageService.get('test_key');
      expect(result).toEqual({ name: 'Test', value: 42 });
    });

    it('should store and retrieve an array', () => {
      storageService.set('test_arr', [1, 2, 3]);
      expect(storageService.get('test_arr')).toEqual([1, 2, 3]);
    });

    it('should store and retrieve a string', () => {
      storageService.set('test_str', 'hello');
      expect(storageService.get('test_str')).toBe('hello');
    });

    it('should store and retrieve a number', () => {
      storageService.set('test_num', 99.5);
      expect(storageService.get('test_num')).toBe(99.5);
    });

    it('should store and retrieve a boolean', () => {
      storageService.set('test_bool', true);
      expect(storageService.get('test_bool')).toBe(true);
    });

    it('should store null', () => {
      storageService.set('test_null', null);
      expect(storageService.get('test_null')).toBeNull();
    });

    it('should return default value for non-existent key', () => {
      expect(storageService.get('nonexistent', 'default')).toBe('default');
    });

    it('should return null by default for non-existent key', () => {
      expect(storageService.get('nonexistent')).toBeNull();
    });

    it('should return default for corrupted JSON', () => {
      localStorage.setItem('corrupted', '{invalid json');
      expect(storageService.get('corrupted', 'fallback')).toBe('fallback');
    });
  });

  describe('remove', () => {
    it('should remove a key', () => {
      storageService.set('to_remove', 'data');
      expect(storageService.get('to_remove')).toBe('data');

      storageService.remove('to_remove');
      expect(storageService.get('to_remove')).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear all cw_ prefixed keys', () => {
      storageService.set('cw_test1', 'a');
      storageService.set('cw_test2', 'b');
      localStorage.setItem('other_key', 'c');

      storageService.clearAll();

      expect(storageService.get('cw_test1')).toBeNull();
      expect(storageService.get('cw_test2')).toBeNull();
      expect(localStorage.getItem('other_key')).toBe('c');
    });
  });

  describe('getUsedBytes', () => {
    it('should return 0 when storage is empty', () => {
      expect(storageService.getUsedBytes()).toBe(0);
    });

    it('should return positive bytes after storing data', () => {
      storageService.set('cw_data', { some: 'value' });
      expect(storageService.getUsedBytes()).toBeGreaterThan(0);
    });
  });

  describe('set return values', () => {
    it('should return true on successful set', () => {
      expect(storageService.set('key', 'value')).toBe(true);
    });
  });
});
