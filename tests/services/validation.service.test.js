/**
 * @fileoverview Unit tests for validation service.
 */

import { describe, it, expect } from 'vitest';
import {
  validateActivity,
  validateCalculatorStep,
  validateGoal,
} from '../../src/services/validation.service.js';

describe('validateActivity', () => {
  it('should accept a valid activity', () => {
    const result = validateActivity({
      category: 'transport',
      type: 'car_gasoline',
      quantity: 50,
      date: '2026-01-15',
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.sanitized).toBeTruthy();
    expect(result.sanitized.category).toBe('transport');
    expect(result.sanitized.quantity).toBe(50);
  });

  it('should reject null activity', () => {
    const result = validateActivity(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Activity must be a non-null object.');
  });

  it('should reject non-object activity', () => {
    const result = validateActivity('not an object');
    expect(result.valid).toBe(false);
  });

  it('should reject invalid category', () => {
    const result = validateActivity({
      category: 'teleportation',
      type: 'beam',
      quantity: 1,
      date: '2026-01-15',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Category'))).toBe(true);
  });

  it('should reject invalid type for category', () => {
    const result = validateActivity({
      category: 'transport',
      type: 'teleporter',
      quantity: 1,
      date: '2026-01-15',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid type'))).toBe(true);
  });

  it('should reject negative quantity', () => {
    const result = validateActivity({
      category: 'transport',
      type: 'car_gasoline',
      quantity: -10,
      date: '2026-01-15',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('positive'))).toBe(true);
  });

  it('should reject missing date', () => {
    const result = validateActivity({
      category: 'transport',
      type: 'car_gasoline',
      quantity: 50,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('date'))).toBe(true);
  });

  it('should reject future dates', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const result = validateActivity({
      category: 'transport',
      type: 'car_gasoline',
      quantity: 50,
      date: futureDate.toISOString().split('T')[0],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('future'))).toBe(true);
  });

  it('should truncate long notes', () => {
    const longNote = 'A'.repeat(500);
    const result = validateActivity({
      category: 'transport',
      type: 'car_gasoline',
      quantity: 50,
      date: '2026-01-15',
      note: longNote,
    });
    expect(result.valid).toBe(true);
    expect(result.sanitized.note.length).toBeLessThanOrEqual(200);
  });

  it('should sanitize XSS in notes', () => {
    const result = validateActivity({
      category: 'transport',
      type: 'car_gasoline',
      quantity: 50,
      date: '2026-01-15',
      note: '<script>alert("xss")</script>',
    });
    expect(result.valid).toBe(true);
    expect(result.sanitized.note).not.toContain('<script>');
  });
});

describe('validateCalculatorStep', () => {
  it('should accept valid transport data', () => {
    const result = validateCalculatorStep('transport', {
      carKmPerWeek: 100,
      flightsPerYear: 2,
    });
    expect(result.valid).toBe(true);
  });

  it('should reject null data', () => {
    const result = validateCalculatorStep('transport', null);
    expect(result.valid).toBe(false);
  });

  it('should reject excessive car distance', () => {
    const result = validateCalculatorStep('transport', {
      carKmPerWeek: 99999,
    });
    expect(result.valid).toBe(false);
  });

  it('should accept valid food data', () => {
    const result = validateCalculatorStep('food', {
      dietType: 'vegetarian',
    });
    expect(result.valid).toBe(true);
  });

  it('should reject invalid diet type', () => {
    const result = validateCalculatorStep('food', {
      dietType: 'alien_cuisine',
    });
    expect(result.valid).toBe(false);
  });

  it('should reject unknown step', () => {
    const result = validateCalculatorStep('unknown_step', {});
    expect(result.valid).toBe(false);
  });
});

describe('validateGoal', () => {
  it('should accept a valid goal', () => {
    const result = validateGoal({
      name: 'Reduce emissions',
      targetPercent: 10,
      baselineKg: 500,
      startDate: '2026-01-01',
      endDate: '2026-04-01',
    });
    expect(result.valid).toBe(true);
    expect(result.sanitized.name).toBe('Reduce emissions');
  });

  it('should reject null goal', () => {
    const result = validateGoal(null);
    expect(result.valid).toBe(false);
  });

  it('should reject empty name', () => {
    const result = validateGoal({
      name: '',
      targetPercent: 10,
      startDate: '2026-01-01',
      endDate: '2026-04-01',
    });
    expect(result.valid).toBe(false);
  });

  it('should reject target percent > 100', () => {
    const result = validateGoal({
      name: 'Test',
      targetPercent: 150,
      startDate: '2026-01-01',
      endDate: '2026-04-01',
    });
    expect(result.valid).toBe(false);
  });

  it('should reject end date before start date', () => {
    const result = validateGoal({
      name: 'Test',
      targetPercent: 10,
      startDate: '2026-06-01',
      endDate: '2026-01-01',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('after'))).toBe(true);
  });

  it('should reject overly long names', () => {
    const result = validateGoal({
      name: 'A'.repeat(200),
      targetPercent: 10,
      startDate: '2026-01-01',
      endDate: '2026-04-01',
    });
    expect(result.valid).toBe(false);
  });
});
