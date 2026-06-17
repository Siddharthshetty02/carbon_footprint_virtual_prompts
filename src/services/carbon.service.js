/**
 * @fileoverview Carbon emission calculation service.
 * Computes CO₂e emissions from activities using EPA/DEFRA emission factors.
 * @module CarbonService
 */

import {
  CATEGORIES,
  TRANSPORT_FACTORS,
  ENERGY_FACTORS,
  FOOD_FACTORS,
  SHOPPING_FACTORS,
  WASTE_FACTORS,
  AVERAGES,
  STORAGE_KEYS,
  MAX_ACTIVITIES,
} from '../utils/constants.js';
import { generateId, sumBy, groupBy, toISODate, startOfDay, daysBetween } from '../utils/helpers.js';
import { storageService } from './storage.service.js';
import { validateActivity } from './validation.service.js';

/**
 * All emission factor maps indexed by category.
 * @type {Record<string, Object>}
 */
const FACTOR_MAPS = {
  transport: TRANSPORT_FACTORS,
  energy: ENERGY_FACTORS,
  food: FOOD_FACTORS,
  shopping: SHOPPING_FACTORS,
  waste: WASTE_FACTORS,
};

/**
 * Calculates the CO₂e emission for a single activity.
 * @param {string} category - Category ID.
 * @param {string} type - Activity type key.
 * @param {number} quantity - Amount/quantity.
 * @returns {number} Emission in kg CO₂e.
 */
export function calculateEmission(category, type, quantity) {
  const factorMap = FACTOR_MAPS[category];
  if (!factorMap) {
    return 0;
  }
  const factor = factorMap[type];
  if (!factor) {
    return 0;
  }
  return Math.max(0, factor.factor * quantity);
}

/**
 * Gets the label and unit for an activity type.
 * @param {string} category - Category ID.
 * @param {string} type - Activity type key.
 * @returns {{label: string, unit: string}} Type metadata.
 */
export function getTypeInfo(category, type) {
  const factorMap = FACTOR_MAPS[category];
  if (!factorMap || !factorMap[type]) {
    return { label: type, unit: 'unit' };
  }
  return { label: factorMap[type].label, unit: factorMap[type].unit };
}

/**
 * Returns all activity types for a category.
 * @param {string} category - Category ID.
 * @returns {Array<{key: string, label: string, unit: string, factor: number}>} Types list.
 */
export function getTypesForCategory(category) {
  const factorMap = FACTOR_MAPS[category];
  if (!factorMap) {
    return [];
  }
  return Object.entries(factorMap).map(([key, val]) => ({
    key,
    label: val.label,
    unit: val.unit,
    factor: val.factor,
  }));
}

// ─── Activity CRUD ────────────────────────────────────────

/**
 * Retrieves all stored activities, sorted by date (newest first).
 * @returns {Array<Object>} Stored activities.
 */
export function getActivities() {
  return storageService.get(STORAGE_KEYS.ACTIVITIES, []);
}

/**
 * Adds a new activity after validation.
 * @param {Object} activityData - Raw activity data.
 * @returns {{success: boolean, errors: string[], activity: Object|null}} Result.
 */
export function addActivity(activityData) {
  const { valid, errors, sanitized } = validateActivity(activityData);
  if (!valid) {
    return { success: false, errors, activity: null };
  }

  const activities = getActivities();

  // Enforce maximum activities limit
  if (activities.length >= MAX_ACTIVITIES) {
    // Remove oldest activity to make room
    activities.pop();
  }

  const activity = {
    ...sanitized,
    id: generateId(),
    emission: calculateEmission(sanitized.category, sanitized.type, sanitized.quantity),
  };

  activities.unshift(activity);
  storageService.set(STORAGE_KEYS.ACTIVITIES, activities);

  return { success: true, errors: [], activity };
}

/**
 * Deletes an activity by ID.
 * @param {string} activityId - ID of the activity to delete.
 * @returns {boolean} True if deleted successfully.
 */
export function deleteActivity(activityId) {
  if (!activityId || typeof activityId !== 'string') {
    return false;
  }
  const activities = getActivities();
  const filtered = activities.filter((a) => a.id !== activityId);
  if (filtered.length === activities.length) {
    return false; // Not found
  }
  storageService.set(STORAGE_KEYS.ACTIVITIES, filtered);
  return true;
}

/**
 * Updates an existing activity.
 * @param {string} activityId - ID of the activity to update.
 * @param {Object} updates - Updated fields.
 * @returns {{success: boolean, errors: string[]}} Result.
 */
export function updateActivity(activityId, updates) {
  const activities = getActivities();
  const index = activities.findIndex((a) => a.id === activityId);
  if (index === -1) {
    return { success: false, errors: ['Activity not found.'] };
  }

  const merged = { ...activities[index], ...updates };
  const { valid, errors, sanitized } = validateActivity(merged);
  if (!valid) {
    return { success: false, errors };
  }

  activities[index] = {
    ...sanitized,
    id: activityId,
    emission: calculateEmission(sanitized.category, sanitized.type, sanitized.quantity),
    updatedAt: new Date().toISOString(),
  };

  storageService.set(STORAGE_KEYS.ACTIVITIES, activities);
  return { success: true, errors: [] };
}

// ─── Analytics ────────────────────────────────────────────

/**
 * Calculates total emissions for a given time period.
 * @param {'day'|'week'|'month'|'year'|'all'} period - Time period.
 * @param {Date} [referenceDate=new Date()] - Reference date for period calculation.
 * @returns {number} Total kg CO₂e for the period.
 */
export function getTotalEmissions(period = 'month', referenceDate = new Date()) {
  const activities = getActivitiesForPeriod(period, referenceDate);
  return sumBy(activities, (a) => a.emission || 0);
}

/**
 * Filters activities to a specific time period.
 * @param {'day'|'week'|'month'|'year'|'all'} period - Time period.
 * @param {Date} [referenceDate=new Date()] - Reference date.
 * @returns {Array<Object>} Filtered activities.
 */
export function getActivitiesForPeriod(period = 'month', referenceDate = new Date()) {
  const activities = getActivities();
  if (period === 'all') {
    return activities;
  }

  const ref = startOfDay(referenceDate);
  let startDate;

  switch (period) {
    case 'day':
      startDate = new Date(ref);
      break;
    case 'week':
      startDate = new Date(ref);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(ref);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate = new Date(ref);
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate = new Date(ref);
      startDate.setMonth(startDate.getMonth() - 1);
  }

  return activities.filter((a) => new Date(a.date) >= startDate);
}

/**
 * Gets emissions breakdown by category for a period.
 * @param {'day'|'week'|'month'|'year'|'all'} period - Time period.
 * @returns {Array<{category: string, label: string, icon: string, color: string, emission: number, percentage: number}>}
 */
export function getCategoryBreakdown(period = 'month') {
  const activities = getActivitiesForPeriod(period);
  const total = sumBy(activities, (a) => a.emission || 0);
  const grouped = groupBy(activities, (a) => a.category);

  return Object.keys(CATEGORIES).map((catId) => {
    const cat = CATEGORIES[catId];
    const catActivities = grouped[catId] || [];
    const emission = sumBy(catActivities, (a) => a.emission || 0);
    return {
      category: catId,
      label: cat.label,
      icon: cat.icon,
      color: cat.color,
      emission,
      percentage: total > 0 ? (emission / total) * 100 : 0,
    };
  });
}

/**
 * Gets daily emission totals for the last N days (for trend chart).
 * @param {number} [days=30] - Number of days to include.
 * @returns {Array<{date: string, emission: number}>} Daily totals.
 */
export function getDailyTrend(days = 30) {
  const activities = getActivities();
  const result = [];
  const today = startOfDay(new Date());

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = toISODate(date);

    const dayActivities = activities.filter((a) => a.date === dateStr);
    const emission = sumBy(dayActivities, (a) => a.emission || 0);

    result.push({ date: dateStr, emission });
  }

  return result;
}

/**
 * Compares current monthly emissions against global/national averages.
 * @returns {{monthlyKg: number, yearlyProjectedTonnes: number, comparedTo: Record<string, number>}}
 */
export function getComparison() {
  const monthlyKg = getTotalEmissions('month');
  const yearlyProjectedTonnes = (monthlyKg * 12) / 1000;

  const comparedTo = {};
  for (const [region, avg] of Object.entries(AVERAGES)) {
    comparedTo[region] = yearlyProjectedTonnes > 0 ? ((yearlyProjectedTonnes - avg) / avg) * 100 : -100;
  }

  return { monthlyKg, yearlyProjectedTonnes, comparedTo };
}

/**
 * Calculates current logging streak (consecutive days with activities).
 * @returns {number} Streak in days.
 */
export function getStreak() {
  const activities = getActivities();
  if (activities.length === 0) {
    return 0;
  }

  const uniqueDates = [...new Set(activities.map((a) => a.date))].sort().reverse();
  const today = toISODate(new Date());
  const yesterday = toISODate(new Date(Date.now() - 86400000));

  // Streak must include today or yesterday
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const diff = daysBetween(new Date(uniqueDates[i - 1]), new Date(uniqueDates[i]));
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ─── Calculator ───────────────────────────────────────────

/**
 * Computes annual carbon footprint from calculator responses.
 * @param {Object} responses - Calculator form responses.
 * @returns {{totalKg: number, breakdown: Record<string, number>}} Annual footprint.
 */
export function computeFootprint(responses) {
  const breakdown = {
    transport: 0,
    energy: 0,
    food: 0,
    shopping: 0,
    waste: 0,
  };

  // Transport
  const carKm = (responses.carKmPerWeek || 0) * 52;
  const carType = responses.carType || 'car_gasoline';
  breakdown.transport += calculateEmission('transport', carType, carKm);

  const publicTransitKm = (responses.publicTransitKmPerWeek || 0) * 52;
  breakdown.transport += calculateEmission('transport', 'bus', publicTransitKm * 0.5);
  breakdown.transport += calculateEmission('transport', 'train', publicTransitKm * 0.5);

  const shortFlights = responses.shortFlightsPerYear || 0;
  breakdown.transport += calculateEmission('transport', 'flight_short', shortFlights * 1000);
  const longFlights = responses.longFlightsPerYear || 0;
  breakdown.transport += calculateEmission('transport', 'flight_long', longFlights * 6000);

  // Energy
  const electricityKwh = (responses.electricityKwh || 0) * 12;
  breakdown.energy += calculateEmission('energy', 'electricity', electricityKwh);
  const gasM3 = (responses.gasM3 || 0) * 12;
  breakdown.energy += calculateEmission('energy', 'natural_gas', gasM3);

  // Food (annual meals = 365 * 3 = 1095)
  const dietMultipliers = {
    heavy_meat: { beef: 0.3, chicken: 0.3, vegetarian: 0.2, vegan: 0.2 },
    medium_meat: { beef: 0.15, chicken: 0.25, fish: 0.15, vegetarian: 0.25, vegan: 0.2 },
    light_meat: { beef: 0.05, chicken: 0.15, fish: 0.1, vegetarian: 0.35, vegan: 0.35 },
    pescatarian: { fish: 0.3, vegetarian: 0.35, vegan: 0.35 },
    vegetarian: { vegetarian: 0.5, vegan: 0.3, dairy: 0.2 },
    vegan: { vegan: 1.0 },
  };

  const diet = dietMultipliers[responses.dietType] || dietMultipliers.medium_meat;
  const annualMeals = 1095;
  if (diet.beef) { breakdown.food += calculateEmission('food', 'meat_beef', annualMeals * diet.beef); }
  if (diet.chicken) { breakdown.food += calculateEmission('food', 'meat_chicken', annualMeals * diet.chicken); }
  if (diet.fish) { breakdown.food += calculateEmission('food', 'fish', annualMeals * diet.fish); }
  if (diet.vegetarian) { breakdown.food += calculateEmission('food', 'vegetarian', annualMeals * diet.vegetarian); }
  if (diet.vegan) { breakdown.food += calculateEmission('food', 'vegan', annualMeals * diet.vegan); }
  if (diet.dairy) { breakdown.food += calculateEmission('food', 'dairy', annualMeals * diet.dairy); }

  // Shopping
  const clothing = (responses.newClothingPerMonth || 0) * 12;
  breakdown.shopping += calculateEmission('shopping', 'clothing_new', clothing);
  const onlineOrders = (responses.onlineOrdersPerMonth || 0) * 12;
  breakdown.shopping += calculateEmission('shopping', 'online_order', onlineOrders);

  // Waste (weekly kg)
  const wasteKgWeek = responses.wasteKgPerWeek || 5;
  const recyclingPercent = (responses.recyclingPercent || 30) / 100;
  const annualWaste = wasteKgWeek * 52;
  breakdown.waste += calculateEmission('waste', 'recycling', annualWaste * recyclingPercent);
  breakdown.waste += calculateEmission('waste', 'landfill', annualWaste * (1 - recyclingPercent));

  const totalKg = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return { totalKg, breakdown };
}

/**
 * Saves calculator results to storage.
 * @param {Object} results - Calculator results.
 */
export function saveCalculatorResults(results) {
  storageService.set(STORAGE_KEYS.CALCULATOR_RESULTS, {
    ...results,
    completedAt: new Date().toISOString(),
  });
}

/**
 * Retrieves saved calculator results.
 * @returns {Object|null} Saved results.
 */
export function getCalculatorResults() {
  return storageService.get(STORAGE_KEYS.CALCULATOR_RESULTS, null);
}

// ─── Goals ────────────────────────────────────────────────

/**
 * Retrieves all stored goals.
 * @returns {Array<Object>} Goals array.
 */
export function getGoals() {
  return storageService.get(STORAGE_KEYS.GOALS, []);
}

/**
 * Saves goals array.
 * @param {Array<Object>} goals - Goals to save.
 */
export function saveGoals(goals) {
  storageService.set(STORAGE_KEYS.GOALS, goals);
}

/**
 * Gets the category color for display.
 * @param {string} categoryId - Category ID.
 * @returns {string} CSS color string.
 */
export function getCategoryColor(categoryId) {
  return CATEGORIES[categoryId]?.color || '#64748b';
}

/**
 * Gets the category icon.
 * @param {string} categoryId - Category ID.
 * @returns {string} Emoji icon.
 */
export function getCategoryIcon(categoryId) {
  return CATEGORIES[categoryId]?.icon || '📦';
}
