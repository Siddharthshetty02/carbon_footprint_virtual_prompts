/**
 * @fileoverview Input validation service for form data and stored objects.
 * Provides schema validation and type checking for all user inputs.
 * @module ValidationService
 */

import { sanitizeString, sanitizeNumber, isValidDate } from '../utils/sanitize.js';
import { CATEGORIES, TRANSPORT_FACTORS, ENERGY_FACTORS, FOOD_FACTORS, SHOPPING_FACTORS, WASTE_FACTORS } from '../utils/constants.js';

/**
 * Gets all valid factor keys for a given category.
 * @param {string} category - Category ID.
 * @returns {string[]} Array of valid factor keys.
 */
function getValidFactorKeys(category) {
  const factorMaps = {
    transport: TRANSPORT_FACTORS,
    energy: ENERGY_FACTORS,
    food: FOOD_FACTORS,
    shopping: SHOPPING_FACTORS,
    waste: WASTE_FACTORS,
  };
  const map = factorMaps[category];
  return map ? Object.keys(map) : [];
}

/**
 * Validates an activity object for storage.
 * @param {Object} activity - Activity data to validate.
 * @returns {{valid: boolean, errors: string[], sanitized: Object|null}} Validation result.
 */
export function validateActivity(activity) {
  const errors = [];

  if (!activity || typeof activity !== 'object') {
    return { valid: false, errors: ['Activity must be a non-null object.'], sanitized: null };
  }

  // Validate category
  const validCategories = Object.keys(CATEGORIES);
  if (!activity.category || !validCategories.includes(activity.category)) {
    errors.push(`Category must be one of: ${validCategories.join(', ')}.`);
  }

  // Validate type
  if (activity.category && !errors.length) {
    const validTypes = getValidFactorKeys(activity.category);
    if (!activity.type || !validTypes.includes(activity.type)) {
      errors.push(`Invalid type for category "${activity.category}".`);
    }
  }

  // Validate quantity
  const quantity = sanitizeNumber(activity.quantity, -1, 0, 100000);
  if (quantity < 0) {
    errors.push('Quantity must be a positive number.');
  }

  // Validate date
  if (!activity.date || !isValidDate(activity.date)) {
    errors.push('A valid date is required.');
  }

  // Validate date is not in the far future
  if (activity.date) {
    const actDate = new Date(activity.date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (actDate > tomorrow) {
      errors.push('Activity date cannot be in the future.');
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, sanitized: null };
  }

  // Return sanitized activity
  return {
    valid: true,
    errors: [],
    sanitized: {
      id: activity.id || undefined, // Will be generated if missing
      category: activity.category,
      type: activity.type,
      quantity,
      date: activity.date,
      note: activity.note ? sanitizeString(String(activity.note)).substring(0, 200) : '',
      createdAt: activity.createdAt || new Date().toISOString(),
    },
  };
}

/**
 * Validates calculator form data for a specific step.
 * @param {string} step - Calculator step name.
 * @param {Object} data - Form data for the step.
 * @returns {{valid: boolean, errors: string[]}} Validation result.
 */
export function validateCalculatorStep(step, data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Form data is required.'] };
  }

  switch (step) {
    case 'transport':
      if (typeof data.carKmPerWeek !== 'undefined') {
        if (sanitizeNumber(data.carKmPerWeek, -1, 0, 5000) < 0) {
          errors.push('Car distance must be between 0 and 5,000 km/week.');
        }
      }
      if (typeof data.flightsPerYear !== 'undefined') {
        if (sanitizeNumber(data.flightsPerYear, -1, 0, 200) < 0) {
          errors.push('Flights must be between 0 and 200 per year.');
        }
      }
      break;

    case 'energy':
      if (typeof data.electricityKwh !== 'undefined') {
        if (sanitizeNumber(data.electricityKwh, -1, 0, 10000) < 0) {
          errors.push('Electricity must be between 0 and 10,000 kWh/month.');
        }
      }
      break;

    case 'food':
      if (typeof data.dietType !== 'undefined') {
        const validDiets = ['heavy_meat', 'medium_meat', 'light_meat', 'pescatarian', 'vegetarian', 'vegan'];
        if (!validDiets.includes(data.dietType)) {
          errors.push('Please select a valid diet type.');
        }
      }
      break;

    case 'lifestyle':
      // Lifestyle has optional numeric fields
      if (typeof data.newClothingPerMonth !== 'undefined') {
        if (sanitizeNumber(data.newClothingPerMonth, -1, 0, 100) < 0) {
          errors.push('Clothing items must be between 0 and 100.');
        }
      }
      break;

    default:
      errors.push(`Unknown calculator step: ${step}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a goal object.
 * @param {Object} goal - Goal data to validate.
 * @returns {{valid: boolean, errors: string[], sanitized: Object|null}} Validation result.
 */
export function validateGoal(goal) {
  const errors = [];

  if (!goal || typeof goal !== 'object') {
    return { valid: false, errors: ['Goal must be a non-null object.'], sanitized: null };
  }

  const reductionPercent = sanitizeNumber(goal.targetPercent, -1, 1, 100);
  if (reductionPercent < 0) {
    errors.push('Reduction target must be between 1% and 100%.');
  }

  if (!goal.name || typeof goal.name !== 'string' || goal.name.trim().length === 0) {
    errors.push('Goal name is required.');
  }

  if (goal.name && goal.name.length > 100) {
    errors.push('Goal name must be under 100 characters.');
  }

  if (!goal.startDate || !isValidDate(goal.startDate)) {
    errors.push('A valid start date is required.');
  }

  if (!goal.endDate || !isValidDate(goal.endDate)) {
    errors.push('A valid end date is required.');
  }

  if (goal.startDate && goal.endDate) {
    if (new Date(goal.endDate) <= new Date(goal.startDate)) {
      errors.push('End date must be after start date.');
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, sanitized: null };
  }

  return {
    valid: true,
    errors: [],
    sanitized: {
      id: goal.id || undefined,
      name: sanitizeString(goal.name.trim()).substring(0, 100),
      targetPercent: reductionPercent,
      baselineKg: sanitizeNumber(goal.baselineKg, 0, 0, 1000000),
      startDate: goal.startDate,
      endDate: goal.endDate,
      createdAt: goal.createdAt || new Date().toISOString(),
    },
  };
}
