/**
 * @fileoverview Personalized insights and recommendation engine.
 * Analyzes user data to generate actionable reduction tips and track achievements.
 * @module InsightsService
 */

import {
  CATEGORIES,
  REDUCTION_TIPS,
  ACHIEVEMENTS,
  FACTS,
  STORAGE_KEYS,
} from '../utils/constants.js';
import { sumBy, groupBy } from '../utils/helpers.js';
import { storageService } from './storage.service.js';
import {
  getActivities,
  getCategoryBreakdown,
  getTotalEmissions,
  getStreak,
  getGoals,
  getCalculatorResults,
} from './carbon.service.js';

/**
 * Generates personalized reduction tips based on user's highest-emission categories.
 * Tips are ranked by impact relative to the user's actual usage patterns.
 * @param {number} [limit=10] - Maximum number of tips to return.
 * @returns {Array<Object>} Ranked list of personalized tips.
 */
export function getPersonalizedTips(limit = 10) {
  const breakdown = getCategoryBreakdown('month');

  // Sort categories by emission (highest first)
  const sortedCategories = [...breakdown].sort((a, b) => b.emission - a.emission);
  const topCategories = sortedCategories
    .filter((c) => c.emission > 0)
    .map((c) => c.category);

  // Prioritize tips from highest-emission categories
  const scoredTips = REDUCTION_TIPS.map((tip) => {
    const categoryRank = topCategories.indexOf(tip.category);
    const categoryWeight = categoryRank >= 0 ? (topCategories.length - categoryRank) : 0;

    const impactWeight = tip.impact === 'high' ? 3 : tip.impact === 'medium' ? 2 : 1;

    return {
      ...tip,
      relevanceScore: categoryWeight * impactWeight,
      categoryLabel: CATEGORIES[tip.category]?.label || tip.category,
      categoryIcon: CATEGORIES[tip.category]?.icon || '📦',
    };
  });

  // Sort by relevance, then by savings
  scoredTips.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return b.savingsKg - a.savingsKg;
  });

  return scoredTips.slice(0, limit);
}

/**
 * Analyzes emission trends (comparing current period to previous).
 * @returns {{direction: 'improving'|'worsening'|'stable', percentChange: number, currentKg: number, previousKg: number}}
 */
export function getTrend() {
  const activities = getActivities();
  const now = new Date();

  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const currentActivities = activities.filter((a) => new Date(a.date) >= currentMonthStart);
  const previousActivities = activities.filter((a) => {
    const d = new Date(a.date);
    return d >= previousMonthStart && d < currentMonthStart;
  });

  const currentKg = sumBy(currentActivities, (a) => a.emission || 0);
  const previousKg = sumBy(previousActivities, (a) => a.emission || 0);

  if (previousKg === 0) {
    return { direction: 'stable', percentChange: 0, currentKg, previousKg };
  }

  const percentChange = ((currentKg - previousKg) / previousKg) * 100;

  let direction = 'stable';
  if (percentChange < -5) {
    direction = 'improving';
  } else if (percentChange > 5) {
    direction = 'worsening';
  }

  return { direction, percentChange, currentKg, previousKg };
}

/**
 * Checks and updates achievement progress.
 * @returns {Array<Object>} All achievements with their current unlocked status.
 */
export function checkAchievements() {
  const activities = getActivities();
  const unlockedIds = storageService.get(STORAGE_KEYS.ACHIEVEMENTS, []);
  const streak = getStreak();
  const goals = getGoals();
  const calcResults = getCalculatorResults();

  // Build metric values
  const metrics = {
    activities_count: activities.length,
    streak_days: streak,
    calculator_completed: calcResults ? 1 : 0,
    goals_count: goals.length,
    green_commutes: activities.filter(
      (a) => a.category === 'transport' && ['bicycle', 'walking', 'subway'].includes(a.type)
    ).length,
    plant_meals: activities.filter(
      (a) => a.category === 'food' && ['vegetarian', 'vegan'].includes(a.type)
    ).length,
    recycling_count: activities.filter(
      (a) => a.category === 'waste' && a.type === 'recycling'
    ).length,
    monthly_below_average: (() => {
      const monthlyKg = getTotalEmissions('month');
      const yearlyTonnes = (monthlyKg * 12) / 1000;
      return yearlyTonnes < 4.7 && activities.length > 0 ? 1 : 0;
    })(),
    goal_50_percent: 0,
    goal_100_percent: 0,
  };

  // Check goal completion
  goals.forEach((goal) => {
    if (goal.progress >= 50) {
      metrics.goal_50_percent = 1;
    }
    if (goal.progress >= 100) {
      metrics.goal_100_percent = 1;
    }
  });

  const newlyUnlocked = [];

  const enriched = ACHIEVEMENTS.map((achievement) => {
    const metricValue = metrics[achievement.condition] || 0;
    const unlocked = unlockedIds.includes(achievement.id) || metricValue >= achievement.threshold;

    if (unlocked && !unlockedIds.includes(achievement.id)) {
      newlyUnlocked.push(achievement.id);
    }

    return {
      ...achievement,
      unlocked,
      progress: Math.min(100, (metricValue / achievement.threshold) * 100),
    };
  });

  // Save newly unlocked achievements
  if (newlyUnlocked.length > 0) {
    storageService.set(STORAGE_KEYS.ACHIEVEMENTS, [...unlockedIds, ...newlyUnlocked]);
  }

  return enriched;
}

/**
 * Gets a random educational fact.
 * @returns {{text: string, source: string}} Random fact.
 */
export function getRandomFact() {
  const index = Math.floor(Math.random() * FACTS.length);
  return FACTS[index];
}

/**
 * Gets category-specific deep dive insights.
 * @param {string} categoryId - Category to analyze.
 * @returns {{category: Object, monthlyEmission: number, tips: Array, comparison: string}}
 */
export function getCategoryInsight(categoryId) {
  const category = CATEGORIES[categoryId];
  if (!category) {
    return null;
  }

  const activities = getActivities();
  const catActivities = activities.filter((a) => a.category === categoryId);
  const grouped = groupBy(catActivities, (a) => a.type);

  const topTypes = Object.entries(grouped)
    .map(([type, acts]) => ({
      type,
      totalEmission: sumBy(acts, (a) => a.emission || 0),
      count: acts.length,
    }))
    .sort((a, b) => b.totalEmission - a.totalEmission);

  const tips = REDUCTION_TIPS.filter((t) => t.category === categoryId);

  const monthlyEmission = sumBy(
    catActivities.filter((a) => {
      const d = new Date(a.date);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return d >= monthAgo;
    }),
    (a) => a.emission || 0
  );

  return {
    category,
    monthlyEmission,
    topTypes,
    tips,
  };
}

/**
 * Generates a summary message for the dashboard.
 * @returns {string} Personalized summary message.
 */
export function getDashboardMessage() {
  const activities = getActivities();
  if (activities.length === 0) {
    return 'Welcome to CarbonWise! Start by calculating your carbon footprint or logging your first activity.';
  }

  const trend = getTrend();
  const streak = getStreak();

  if (trend.direction === 'improving') {
    return `Great progress! Your emissions are down ${Math.abs(trend.percentChange).toFixed(0)}% this month. ${streak > 1 ? `You're on a ${streak}-day streak! 🔥` : ''}`;
  }

  if (trend.direction === 'worsening') {
    return `Your emissions increased ${trend.percentChange.toFixed(0)}% this month. Check the insights tab for personalized tips to reduce your impact.`;
  }

  return `You're tracking steadily. ${streak > 1 ? `Keep up your ${streak}-day streak! 🔥` : 'Log activities daily to build a streak!'}`;
}
