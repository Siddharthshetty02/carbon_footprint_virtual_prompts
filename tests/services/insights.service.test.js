/**
 * @fileoverview Unit tests for insights service.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { addActivity } from '../../src/services/carbon.service.js';
import {
  getPersonalizedTips,
  getTrend,
  checkAchievements,
  getRandomFact,
  getDashboardMessage,
} from '../../src/services/insights.service.js';

describe('InsightsService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getPersonalizedTips', () => {
    it('should return tips array', () => {
      const tips = getPersonalizedTips();
      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBeGreaterThan(0);
      expect(tips.length).toBeLessThanOrEqual(10);
    });

    it('should respect limit parameter', () => {
      const tips = getPersonalizedTips(3);
      expect(tips.length).toBeLessThanOrEqual(3);
    });

    it('should have required properties on each tip', () => {
      const tips = getPersonalizedTips(1);
      expect(tips[0]).toHaveProperty('title');
      expect(tips[0]).toHaveProperty('description');
      expect(tips[0]).toHaveProperty('impact');
      expect(tips[0]).toHaveProperty('savingsKg');
      expect(tips[0]).toHaveProperty('category');
    });

    it('should prioritize tips from high-emission categories', () => {
      const today = new Date().toISOString().split('T')[0];
      // Add many transport activities to make transport the top category
      for (let i = 0; i < 5; i++) {
        addActivity({ category: 'transport', type: 'car_gasoline', quantity: 200, date: today });
      }

      const tips = getPersonalizedTips(5);
      // First tip should be transport-related since that's the top category
      const transportTips = tips.filter((t) => t.category === 'transport');
      expect(transportTips.length).toBeGreaterThan(0);
    });
  });

  describe('getTrend', () => {
    it('should return trend object', () => {
      const trend = getTrend();
      expect(trend).toHaveProperty('direction');
      expect(trend).toHaveProperty('percentChange');
      expect(trend).toHaveProperty('currentKg');
      expect(trend).toHaveProperty('previousKg');
    });

    it('should report stable with no data', () => {
      const trend = getTrend();
      expect(trend.direction).toBe('stable');
    });

    it('should have valid direction values', () => {
      const trend = getTrend();
      expect(['improving', 'worsening', 'stable']).toContain(trend.direction);
    });
  });

  describe('checkAchievements', () => {
    it('should return all achievements', () => {
      const achievements = checkAchievements();
      expect(achievements.length).toBeGreaterThan(0);
    });

    it('should have required properties', () => {
      const achievements = checkAchievements();
      expect(achievements[0]).toHaveProperty('id');
      expect(achievements[0]).toHaveProperty('name');
      expect(achievements[0]).toHaveProperty('icon');
      expect(achievements[0]).toHaveProperty('unlocked');
      expect(achievements[0]).toHaveProperty('progress');
    });

    it('should unlock first_log achievement after logging an activity', () => {
      const today = new Date().toISOString().split('T')[0];
      addActivity({ category: 'transport', type: 'bus', quantity: 10, date: today });

      const achievements = checkAchievements();
      const firstLog = achievements.find((a) => a.id === 'first_log');
      expect(firstLog.unlocked).toBe(true);
    });

    it('should not unlock streak achievement without consecutive days', () => {
      const achievements = checkAchievements();
      const weekStreak = achievements.find((a) => a.id === 'week_streak');
      expect(weekStreak.unlocked).toBe(false);
    });
  });

  describe('getRandomFact', () => {
    it('should return a fact with text and source', () => {
      const fact = getRandomFact();
      expect(fact).toHaveProperty('text');
      expect(fact).toHaveProperty('source');
      expect(fact.text.length).toBeGreaterThan(10);
      expect(fact.source.length).toBeGreaterThan(0);
    });
  });

  describe('getDashboardMessage', () => {
    it('should return welcome message when no activities', () => {
      const message = getDashboardMessage();
      expect(message).toContain('Welcome');
    });

    it('should return a personalized message after logging activities', () => {
      const today = new Date().toISOString().split('T')[0];
      addActivity({ category: 'transport', type: 'car_gasoline', quantity: 100, date: today });

      const message = getDashboardMessage();
      expect(message.length).toBeGreaterThan(0);
    });
  });
});
