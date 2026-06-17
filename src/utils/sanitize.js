/**
 * @fileoverview Input sanitization utilities for XSS prevention.
 * All user inputs should pass through these functions before DOM insertion or storage.
 * @module sanitize
 */

/**
 * Map of HTML special characters to their entity equivalents.
 * @type {Record<string, string>}
 */
const HTML_ENTITIES = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
});

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str - The string to escape.
 * @returns {string} Escaped HTML-safe string.
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') {
    return '';
  }
  return str.replace(/[&<>"'`/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitizes a string for safe DOM insertion.
 * Removes script tags, event handlers, and dangerous patterns.
 * @param {string} input - Raw user input.
 * @returns {string} Sanitized string.
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handler attributes
  sanitized = sanitized.replace(/\bon\w+\s*=\s*(['"]?).*?\1/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript\s*:/gi, '');

  // Remove data: URLs (can contain scripts)
  sanitized = sanitized.replace(/data\s*:\s*text\/html/gi, '');

  // Remove vbscript: URLs
  sanitized = sanitized.replace(/vbscript\s*:/gi, '');

  // Escape remaining HTML entities
  sanitized = escapeHtml(sanitized);

  return sanitized;
}

/**
 * Sanitizes a numeric input, returning a safe number or default.
 * @param {*} input - The input to sanitize.
 * @param {number} [defaultValue=0] - Default value if input is invalid.
 * @param {number} [min=-Infinity] - Minimum allowed value.
 * @param {number} [max=Infinity] - Maximum allowed value.
 * @returns {number} Sanitized number.
 */
export function sanitizeNumber(input, defaultValue = 0, min = -Infinity, max = Infinity) {
  const num = Number(input);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return defaultValue;
  }
  return Math.min(Math.max(num, min), max);
}

/**
 * Validates and sanitizes a URL string.
 * Only allows http and https protocols.
 * @param {string} url - URL to validate.
 * @returns {string|null} Sanitized URL or null if invalid.
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Validates an ISO date string.
 * @param {string} dateStr - Date string to validate.
 * @returns {boolean} True if valid ISO date.
 */
export function isValidDate(dateStr) {
  if (typeof dateStr !== 'string') {
    return false;
  }
  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
}

/**
 * Validates that a string contains only alphanumeric characters, spaces, and common punctuation.
 * @param {string} str - String to validate.
 * @returns {boolean} True if string is safe.
 */
export function isSafeString(str) {
  if (typeof str !== 'string') {
    return false;
  }
  // Allow letters, numbers, spaces, and common safe punctuation
  return /^[\w\s.,!?;:'"()\-–—/&@#%+= ]*$/u.test(str);
}

/**
 * Truncates a string to a maximum length, adding ellipsis if needed.
 * @param {string} str - String to truncate.
 * @param {number} maxLength - Maximum length.
 * @returns {string} Truncated string.
 */
export function truncate(str, maxLength) {
  if (typeof str !== 'string') {
    return '';
  }
  if (str.length <= maxLength) {
    return str;
  }
  return `${str.substring(0, maxLength - 1)}…`;
}
