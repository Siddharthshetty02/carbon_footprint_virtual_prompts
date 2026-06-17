/**
 * @fileoverview Utility helper functions.
 * Pure functions for date formatting, numbers, debounce, throttle, and ID generation.
 * @module helpers
 */

/**
 * Generates a cryptographically random UUID v4.
 * Uses crypto.randomUUID when available, falls back to manual generation.
 * @returns {string} A UUID v4 string.
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Formats a number to a readable string with fixed decimals.
 * @param {number} value - The number to format.
 * @param {number} [decimals=1] - Number of decimal places.
 * @returns {string} Formatted number string.
 */
export function formatNumber(value, decimals = 1) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(decimals)}k`;
  }
  return value.toFixed(decimals);
}

/**
 * Formats kg CO₂ to a human-readable string with appropriate unit.
 * @param {number} kgCO2 - Emissions in kg CO₂e.
 * @returns {string} Formatted emission string (e.g., "1.2 tonnes" or "450 kg").
 */
export function formatEmission(kgCO2) {
  if (typeof kgCO2 !== 'number' || Number.isNaN(kgCO2)) {
    return '0 kg CO₂';
  }
  if (Math.abs(kgCO2) >= 1000) {
    return `${(kgCO2 / 1000).toFixed(2)} tonnes CO₂`;
  }
  return `${kgCO2.toFixed(1)} kg CO₂`;
}

/**
 * Formats a date to a locale-appropriate display string.
 * @param {string|Date} date - Date to format.
 * @param {'short'|'medium'|'long'} [style='medium'] - Display style.
 * @returns {string} Formatted date string.
 */
export function formatDate(date, style = 'medium') {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return 'Invalid date';
  }

  const options = {
    short: { month: 'short', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
  };

  return d.toLocaleDateString('en-US', options[style] || options.medium);
}

/**
 * Formats a date to a relative time string (e.g., "2 hours ago").
 * @param {string|Date} date - The date to format.
 * @returns {string} Relative time string.
 */
export function formatRelativeTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return 'Unknown';
  }

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return formatDate(d, 'short');
}

/**
 * Gets a date string in ISO date format (YYYY-MM-DD) for a given Date.
 * @param {Date} [date=new Date()] - The date to format.
 * @returns {string} ISO date string.
 */
export function toISODate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Creates a debounced version of a function.
 * @param {Function} fn - The function to debounce.
 * @param {number} delay - Delay in milliseconds.
 * @returns {Function} Debounced function.
 */
export function debounce(fn, delay) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Creates a throttled version of a function.
 * @param {Function} fn - The function to throttle.
 * @param {number} limit - Minimum interval in milliseconds.
 * @returns {Function} Throttled function.
 */
export function throttle(fn, limit) {
  let inThrottle = false;
  return function throttled(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Creates a deep clone of a value using structuredClone when available.
 * @template T
 * @param {T} value - Value to clone.
 * @returns {T} Deep clone of the value.
 */
export function deepClone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

/**
 * Groups an array by a key-generating function.
 * @template T
 * @param {T[]} array - Array to group.
 * @param {(item: T) => string} keyFn - Function to generate group key.
 * @returns {Record<string, T[]>} Grouped object.
 */
export function groupBy(array, keyFn) {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
}

/**
 * Returns a sum of numbers extracted from an array by a value function.
 * @template T
 * @param {T[]} array - Array to sum.
 * @param {(item: T) => number} valueFn - Function to extract numeric value.
 * @returns {number} Sum of values.
 */
export function sumBy(array, valueFn) {
  return array.reduce((sum, item) => sum + (valueFn(item) || 0), 0);
}

/**
 * Clamps a number between a minimum and maximum value.
 * @param {number} value - Value to clamp.
 * @param {number} min - Minimum bound.
 * @param {number} max - Maximum bound.
 * @returns {number} Clamped value.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Returns the start of a day (midnight) for a given date.
 * @param {Date} date - Input date.
 * @returns {Date} Date at midnight.
 */
export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calculates the number of days between two dates.
 * @param {Date} dateA - First date.
 * @param {Date} dateB - Second date.
 * @returns {number} Number of days (absolute).
 */
export function daysBetween(dateA, dateB) {
  const msPerDay = 86400000;
  const a = startOfDay(dateA).getTime();
  const b = startOfDay(dateB).getTime();
  return Math.round(Math.abs(a - b) / msPerDay);
}
