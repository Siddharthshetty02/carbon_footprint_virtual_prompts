/**
 * @fileoverview Unit tests for helper utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  generateId,
  formatNumber,
  formatEmission,
  formatDate,
  formatRelativeTime,
  toISODate,
  debounce,
  throttle,
  deepClone,
  groupBy,
  sumBy,
  clamp,
  startOfDay,
  daysBetween,
} from '../../src/utils/helpers.js';

describe('generateId', () => {
  it('should return a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('should return a UUID-like format', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('should generate unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('formatNumber', () => {
  it('should format small numbers', () => {
    expect(formatNumber(42.567)).toBe('42.6');
  });

  it('should format large numbers with k suffix', () => {
    expect(formatNumber(1500)).toBe('1.5k');
  });

  it('should handle NaN', () => {
    expect(formatNumber(NaN)).toBe('0');
  });

  it('should handle non-number input', () => {
    expect(formatNumber('hello')).toBe('0');
  });

  it('should respect decimal parameter', () => {
    expect(formatNumber(42.567, 2)).toBe('42.57');
  });

  it('should format zero', () => {
    expect(formatNumber(0)).toBe('0.0');
  });
});

describe('formatEmission', () => {
  it('should format small emissions in kg', () => {
    expect(formatEmission(42.5)).toBe('42.5 kg CO₂');
  });

  it('should format large emissions in tonnes', () => {
    expect(formatEmission(1500)).toBe('1.50 tonnes CO₂');
  });

  it('should handle NaN', () => {
    expect(formatEmission(NaN)).toBe('0 kg CO₂');
  });

  it('should handle zero', () => {
    expect(formatEmission(0)).toBe('0.0 kg CO₂');
  });
});

describe('formatDate', () => {
  it('should format a date string', () => {
    const result = formatDate('2026-06-15', 'medium');
    expect(result).toContain('2026');
    expect(result).toContain('Jun');
  });

  it('should format a Date object', () => {
    const result = formatDate(new Date(2026, 5, 15), 'short');
    expect(result).toContain('Jun');
  });

  it('should handle invalid date', () => {
    expect(formatDate('not-a-date')).toBe('Invalid date');
  });
});

describe('formatRelativeTime', () => {
  it('should return "Just now" for recent times', () => {
    expect(formatRelativeTime(new Date())).toBe('Just now');
  });

  it('should handle invalid date', () => {
    expect(formatRelativeTime('invalid')).toBe('Unknown');
  });
});

describe('toISODate', () => {
  it('should return YYYY-MM-DD format', () => {
    const result = toISODate(new Date(2026, 5, 15));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should default to today', () => {
    const result = toISODate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('debounce', () => {
  it('should delay function execution', async () => {
    let called = 0;
    const fn = debounce(() => { called++; }, 50);

    fn();
    fn();
    fn();

    expect(called).toBe(0);
    await new Promise((r) => setTimeout(r, 100));
    expect(called).toBe(1);
  });
});

describe('throttle', () => {
  it('should limit execution frequency', async () => {
    let called = 0;
    const fn = throttle(() => { called++; }, 50);

    fn();
    fn();
    fn();

    expect(called).toBe(1);
    await new Promise((r) => setTimeout(r, 100));
    fn();
    expect(called).toBe(2);
  });
});

describe('deepClone', () => {
  it('should create a deep copy', () => {
    const original = { a: { b: [1, 2, 3] } };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.a).not.toBe(original.a);
    expect(cloned.a.b).not.toBe(original.a.b);
  });
});

describe('groupBy', () => {
  it('should group items by key function', () => {
    const items = [
      { type: 'a', value: 1 },
      { type: 'b', value: 2 },
      { type: 'a', value: 3 },
    ];

    const grouped = groupBy(items, (item) => item.type);
    expect(grouped.a).toHaveLength(2);
    expect(grouped.b).toHaveLength(1);
  });

  it('should handle empty array', () => {
    expect(groupBy([], () => 'key')).toEqual({});
  });
});

describe('sumBy', () => {
  it('should sum values', () => {
    const items = [{ v: 10 }, { v: 20 }, { v: 30 }];
    expect(sumBy(items, (i) => i.v)).toBe(60);
  });

  it('should handle empty array', () => {
    expect(sumBy([], (i) => i.v)).toBe(0);
  });

  it('should handle undefined values', () => {
    const items = [{ v: 10 }, {}, { v: 30 }];
    expect(sumBy(items, (i) => i.v)).toBe(40);
  });
});

describe('clamp', () => {
  it('should clamp value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('startOfDay', () => {
  it('should set time to midnight', () => {
    const result = startOfDay(new Date(2026, 5, 15, 14, 30));
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });
});

describe('daysBetween', () => {
  it('should calculate days between dates', () => {
    const a = new Date(2026, 0, 1);
    const b = new Date(2026, 0, 10);
    expect(daysBetween(a, b)).toBe(9);
  });

  it('should return 0 for same date', () => {
    const d = new Date(2026, 0, 1);
    expect(daysBetween(d, d)).toBe(0);
  });

  it('should handle reversed dates', () => {
    const a = new Date(2026, 0, 10);
    const b = new Date(2026, 0, 1);
    expect(daysBetween(a, b)).toBe(9);
  });
});
