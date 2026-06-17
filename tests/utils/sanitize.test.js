/**
 * @fileoverview Unit tests for sanitization utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  sanitizeString,
  sanitizeNumber,
  sanitizeUrl,
  isValidDate,
  isSafeString,
  truncate,
} from '../../src/utils/sanitize.js';

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('should escape ampersands', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  it('should escape quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('should escape single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#x27;s');
  });

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(42)).toBe('');
  });

  it('should pass through safe strings unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});

describe('sanitizeString', () => {
  it('should remove script tags', () => {
    const result = sanitizeString('<script>alert("xss")</script>hello');
    expect(result).not.toContain('<script>');
    expect(result).toContain('hello');
  });

  it('should remove event handlers', () => {
    const result = sanitizeString('<div onmouseover="alert(1)">test</div>');
    expect(result).not.toContain('onmouseover');
  });

  it('should remove javascript: URLs', () => {
    const result = sanitizeString('javascript:alert(1)');
    expect(result).not.toContain('javascript:');
  });

  it('should remove data:text/html URLs', () => {
    const result = sanitizeString('data:text/html,<script>alert(1)</script>');
    expect(result).not.toContain('data:text/html');
  });

  it('should handle non-string input', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(undefined)).toBe('');
    expect(sanitizeString(42)).toBe('');
  });

  it('should trim whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('should escape remaining HTML entities', () => {
    const result = sanitizeString('<div>hello</div>');
    expect(result).not.toContain('<div>');
  });
});

describe('sanitizeNumber', () => {
  it('should return the number for valid input', () => {
    expect(sanitizeNumber(42)).toBe(42);
  });

  it('should parse string numbers', () => {
    expect(sanitizeNumber('42')).toBe(42);
  });

  it('should return default for NaN', () => {
    expect(sanitizeNumber('hello', 0)).toBe(0);
  });

  it('should return default for undefined', () => {
    expect(sanitizeNumber(undefined, 5)).toBe(5);
  });

  it('should clamp to min', () => {
    expect(sanitizeNumber(-10, 0, 0, 100)).toBe(0);
  });

  it('should clamp to max', () => {
    expect(sanitizeNumber(200, 0, 0, 100)).toBe(100);
  });

  it('should return default for Infinity', () => {
    expect(sanitizeNumber(Infinity, 0)).toBe(0);
  });

  it('should handle null', () => {
    expect(sanitizeNumber(null, 7)).toBe(7);
  });
});

describe('sanitizeUrl', () => {
  it('should accept valid https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
  });

  it('should accept valid http URLs', () => {
    expect(sanitizeUrl('http://example.com/path')).toBe('http://example.com/path');
  });

  it('should reject javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
  });

  it('should reject data: URLs', () => {
    expect(sanitizeUrl('data:text/html,test')).toBeNull();
  });

  it('should reject ftp: URLs', () => {
    expect(sanitizeUrl('ftp://files.example.com')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(sanitizeUrl('')).toBeNull();
  });

  it('should return null for non-string', () => {
    expect(sanitizeUrl(null)).toBeNull();
    expect(sanitizeUrl(42)).toBeNull();
  });

  it('should return null for invalid URL', () => {
    expect(sanitizeUrl('not a url at all')).toBeNull();
  });
});

describe('isValidDate', () => {
  it('should validate ISO date strings', () => {
    expect(isValidDate('2026-01-15')).toBe(true);
  });

  it('should validate ISO datetime strings', () => {
    expect(isValidDate('2026-01-15T12:00:00Z')).toBe(true);
  });

  it('should reject invalid dates', () => {
    expect(isValidDate('not-a-date')).toBe(false);
  });

  it('should reject non-strings', () => {
    expect(isValidDate(null)).toBe(false);
    expect(isValidDate(42)).toBe(false);
  });
});

describe('isSafeString', () => {
  it('should accept plain text', () => {
    expect(isSafeString('Hello World')).toBe(true);
  });

  it('should accept text with common punctuation', () => {
    expect(isSafeString("It's a test, right? Yes!")).toBe(true);
  });

  it('should reject non-strings', () => {
    expect(isSafeString(null)).toBe(false);
  });
});

describe('truncate', () => {
  it('should not truncate short strings', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('should truncate long strings with ellipsis', () => {
    const result = truncate('This is a very long string', 10);
    expect(result.length).toBe(10);
    expect(result).toContain('…');
  });

  it('should handle non-string input', () => {
    expect(truncate(null, 10)).toBe('');
  });

  it('should handle exact length', () => {
    expect(truncate('12345', 5)).toBe('12345');
  });
});
