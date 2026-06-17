/**
 * @fileoverview Unit tests for carbon calculation service.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateEmission,
  getTypeInfo,
  getTypesForCategory,
  addActivity,
  deleteActivity,
  getActivities,
  getTotalEmissions,
  getCategoryBreakdown,
  getDailyTrend,
  getComparison,
  getStreak,
  computeFootprint,
  saveCalculatorResults,
  getCalculatorResults,
  getGoals,
  saveGoals,
  getCategoryColor,
  getCategoryIcon,
} from '../../src/services/carbon.service.js';

describe('calculateEmission', () => {
  it('should calculate car gasoline emissions correctly', () => {
    const result = calculateEmission('transport', 'car_gasoline', 100);
    expect(result).toBeCloseTo(21, 0); // 0.21 * 100
  });

  it('should calculate bus emissions correctly', () => {
    const result = calculateEmission('transport', 'bus', 50);
    expect(result).toBeCloseTo(4.45, 1); // 0.089 * 50
  });

  it('should return 0 for bicycle', () => {
    expect(calculateEmission('transport', 'bicycle', 100)).toBe(0);
  });

  it('should return 0 for invalid category', () => {
    expect(calculateEmission('invalid', 'something', 100)).toBe(0);
  });

  it('should return 0 for invalid type', () => {
    expect(calculateEmission('transport', 'invalid_type', 100)).toBe(0);
  });

  it('should return 0 for zero quantity', () => {
    expect(calculateEmission('transport', 'car_gasoline', 0)).toBe(0);
  });

  it('should handle negative quantity gracefully', () => {
    expect(calculateEmission('transport', 'car_gasoline', -10)).toBe(0);
  });

  it('should calculate food emissions correctly', () => {
    const result = calculateEmission('food', 'meat_beef', 2);
    expect(result).toBeCloseTo(14.4, 1);
  });

  it('should calculate energy emissions correctly', () => {
    const result = calculateEmission('energy', 'electricity', 300);
    expect(result).toBeCloseTo(126, 0);
  });

  it('should calculate waste emissions correctly', () => {
    const result = calculateEmission('waste', 'landfill', 10);
    expect(result).toBeCloseTo(5.8, 1);
  });
});

describe('getTypeInfo', () => {
  it('should return label and unit for valid type', () => {
    const info = getTypeInfo('transport', 'car_gasoline');
    expect(info.label).toBe('Car (Gasoline)');
    expect(info.unit).toBe('km');
  });

  it('should return fallback for invalid type', () => {
    const info = getTypeInfo('transport', 'teleporter');
    expect(info.label).toBe('teleporter');
    expect(info.unit).toBe('unit');
  });

  it('should return fallback for invalid category', () => {
    const info = getTypeInfo('nonexistent', 'anything');
    expect(info.unit).toBe('unit');
  });
});

describe('getTypesForCategory', () => {
  it('should return all transport types', () => {
    const types = getTypesForCategory('transport');
    expect(types.length).toBeGreaterThan(5);
    expect(types[0]).toHaveProperty('key');
    expect(types[0]).toHaveProperty('label');
    expect(types[0]).toHaveProperty('factor');
  });

  it('should return empty array for invalid category', () => {
    expect(getTypesForCategory('invalid')).toEqual([]);
  });
});

describe('Activity CRUD', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should add a valid activity', () => {
    const result = addActivity({
      category: 'transport',
      type: 'car_gasoline',
      quantity: 50,
      date: '2026-01-15',
    });

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.activity).toBeTruthy();
    expect(result.activity.emission).toBeGreaterThan(0);
    expect(result.activity.id).toBeTruthy();
  });

  it('should reject activity with invalid category', () => {
    const result = addActivity({
      category: 'flying_saucer',
      type: 'car_gasoline',
      quantity: 50,
      date: '2026-01-15',
    });

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject activity with missing date', () => {
    const result = addActivity({
      category: 'transport',
      type: 'car_gasoline',
      quantity: 50,
    });

    expect(result.success).toBe(false);
  });

  it('should retrieve activities', () => {
    addActivity({ category: 'transport', type: 'car_gasoline', quantity: 50, date: '2026-01-15' });
    addActivity({ category: 'food', type: 'meat_beef', quantity: 1, date: '2026-01-15' });

    const activities = getActivities();
    expect(activities).toHaveLength(2);
  });

  it('should delete an activity', () => {
    const result = addActivity({ category: 'transport', type: 'bus', quantity: 20, date: '2026-01-15' });
    expect(getActivities()).toHaveLength(1);

    const deleted = deleteActivity(result.activity.id);
    expect(deleted).toBe(true);
    expect(getActivities()).toHaveLength(0);
  });

  it('should return false when deleting non-existent activity', () => {
    expect(deleteActivity('non-existent-id')).toBe(false);
  });

  it('should return false for invalid delete id', () => {
    expect(deleteActivity(null)).toBe(false);
    expect(deleteActivity('')).toBe(false);
  });
});

describe('Analytics', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return 0 total emissions when no activities', () => {
    expect(getTotalEmissions('month')).toBe(0);
  });

  it('should calculate total emissions for period', () => {
    const today = new Date().toISOString().split('T')[0];
    addActivity({ category: 'transport', type: 'car_gasoline', quantity: 100, date: today });
    addActivity({ category: 'food', type: 'meat_beef', quantity: 2, date: today });

    const total = getTotalEmissions('month');
    expect(total).toBeGreaterThan(0);
  });

  it('should return category breakdown', () => {
    const today = new Date().toISOString().split('T')[0];
    addActivity({ category: 'transport', type: 'car_gasoline', quantity: 100, date: today });

    const breakdown = getCategoryBreakdown('month');
    expect(breakdown).toHaveLength(5); // 5 categories
    const transportEntry = breakdown.find((c) => c.category === 'transport');
    expect(transportEntry.emission).toBeGreaterThan(0);
  });

  it('should return daily trend data', () => {
    const trend = getDailyTrend(7);
    expect(trend).toHaveLength(7);
    expect(trend[0]).toHaveProperty('date');
    expect(trend[0]).toHaveProperty('emission');
  });

  it('should return comparison data', () => {
    const comparison = getComparison();
    expect(comparison).toHaveProperty('monthlyKg');
    expect(comparison).toHaveProperty('yearlyProjectedTonnes');
    expect(comparison).toHaveProperty('comparedTo');
    expect(comparison.comparedTo).toHaveProperty('global');
  });

  it('should return 0 streak when no activities', () => {
    expect(getStreak()).toBe(0);
  });
});

describe('computeFootprint', () => {
  it('should compute a non-zero footprint with typical data', () => {
    const result = computeFootprint({
      carType: 'car_gasoline',
      carKmPerWeek: 100,
      publicTransitKmPerWeek: 20,
      shortFlightsPerYear: 2,
      longFlightsPerYear: 1,
      electricityKwh: 300,
      gasM3: 30,
      dietType: 'medium_meat',
      newClothingPerMonth: 3,
      onlineOrdersPerMonth: 5,
      wasteKgPerWeek: 5,
      recyclingPercent: 30,
    });

    expect(result.totalKg).toBeGreaterThan(0);
    expect(result.breakdown.transport).toBeGreaterThan(0);
    expect(result.breakdown.energy).toBeGreaterThan(0);
    expect(result.breakdown.food).toBeGreaterThan(0);
    expect(result.breakdown.shopping).toBeGreaterThan(0);
    expect(result.breakdown.waste).toBeGreaterThan(0);
  });

  it('should compute lower footprint for vegan diet', () => {
    const vegan = computeFootprint({ dietType: 'vegan', carKmPerWeek: 0 });
    const heavyMeat = computeFootprint({ dietType: 'heavy_meat', carKmPerWeek: 0 });

    expect(vegan.breakdown.food).toBeLessThan(heavyMeat.breakdown.food);
  });

  it('should handle empty responses gracefully', () => {
    const result = computeFootprint({});
    expect(result.totalKg).toBeGreaterThanOrEqual(0);
    expect(result.breakdown).toBeDefined();
  });
});

describe('Calculator Results', () => {
  it('should save and retrieve calculator results', () => {
    const data = { totalKg: 5000, breakdown: { transport: 2000 } };
    saveCalculatorResults(data);

    const retrieved = getCalculatorResults();
    expect(retrieved.totalKg).toBe(5000);
    expect(retrieved.completedAt).toBeTruthy();
  });

  it('should return null when no results saved', () => {
    expect(getCalculatorResults()).toBeNull();
  });
});

describe('Goals', () => {
  it('should get empty goals initially', () => {
    expect(getGoals()).toEqual([]);
  });

  it('should save and retrieve goals', () => {
    const goals = [{ name: 'Test Goal', targetPercent: 10 }];
    saveGoals(goals);
    expect(getGoals()).toEqual(goals);
  });
});

describe('Category Helpers', () => {
  it('should return correct color for category', () => {
    expect(getCategoryColor('transport')).toBe('#3b82f6');
  });

  it('should return fallback color for invalid category', () => {
    expect(getCategoryColor('nonexistent')).toBe('#64748b');
  });

  it('should return correct icon for category', () => {
    expect(getCategoryIcon('food')).toBe('🍽️');
  });

  it('should return fallback icon for invalid category', () => {
    expect(getCategoryIcon('nonexistent')).toBe('📦');
  });
});
