/**
 * @fileoverview Dashboard page — overview of carbon footprint with charts and quick actions.
 * @module DashboardPage
 */

import { escapeHtml } from '../utils/sanitize.js';
import { formatEmission, formatNumber } from '../utils/helpers.js';
import {
  getTotalEmissions,
  getCategoryBreakdown,
  getDailyTrend,
  getComparison,
  getStreak,
  getActivities,
} from '../services/carbon.service.js';
import { getDashboardMessage, getTrend } from '../services/insights.service.js';
import { renderDonutChart, renderLineChart, renderLegend } from '../services/chart.service.js';
import { navigate } from '../router.js';

/**
 * Renders the dashboard page.
 * @param {HTMLElement} container - Page container.
 */
export function render(container) {
  const totalMonth = getTotalEmissions('month');
  const totalWeek = getTotalEmissions('week');
  const totalToday = getTotalEmissions('day');
  const streak = getStreak();
  const trend = getTrend();
  const comparison = getComparison();
  const activities = getActivities();
  const message = getDashboardMessage();

  const trendIcon = trend.direction === 'improving' ? '↓' : trend.direction === 'worsening' ? '↑' : '→';
  const trendClass = trend.direction === 'improving' ? 'stat-trend-down' : trend.direction === 'worsening' ? 'stat-trend-up' : 'stat-trend-neutral';

  container.innerHTML = `
    <div class="animate-fade-up">
      <div class="page-header">
        <h1 class="page-title" id="dashboard-heading">Dashboard</h1>
        <p class="page-description">${escapeHtml(message)}</p>
      </div>

      <!-- Stats Row -->
      <div class="dashboard-stats" role="region" aria-label="Emission statistics">
        <div class="card stat-card animate-fade-up animate-delay-1" id="stat-monthly">
          <div class="card-label">This Month</div>
          <div class="card-value">${escapeHtml(formatEmission(totalMonth))}</div>
          <div class="stat-trend ${trendClass}" aria-label="${trend.direction}: ${Math.abs(trend.percentChange).toFixed(0)}% compared to last month">
            <span>${trendIcon}</span>
            <span>${Math.abs(trend.percentChange).toFixed(0)}%</span>
          </div>
        </div>

        <div class="card stat-card animate-fade-up animate-delay-2" id="stat-weekly">
          <div class="card-label">This Week</div>
          <div class="card-value">${escapeHtml(formatEmission(totalWeek))}</div>
        </div>

        <div class="card stat-card animate-fade-up animate-delay-3" id="stat-today">
          <div class="card-label">Today</div>
          <div class="card-value">${escapeHtml(formatEmission(totalToday))}</div>
        </div>

        <div class="card stat-card animate-fade-up animate-delay-4" id="stat-streak">
          <div class="card-label">Streak</div>
          <div class="card-value">${streak}<span style="font-size: var(--font-size-lg); margin-left: var(--space-1);">days</span></div>
          ${streak >= 7 ? '<span class="badge badge-primary">🔥 On Fire</span>' : ''}
        </div>
      </div>

      <!-- Charts Row -->
      <div class="dashboard-charts" role="region" aria-label="Emission charts">
        <div class="card animate-fade-up" id="chart-breakdown-card">
          <div class="card-header">
            <h2 class="card-title">Category Breakdown</h2>
            <span class="badge badge-accent">Monthly</span>
          </div>
          <div class="chart-container" style="aspect-ratio: 1/1; max-height: 280px;">
            <canvas id="donut-chart" aria-label="Category breakdown donut chart"></canvas>
          </div>
          <div id="donut-legend"></div>
        </div>

        <div class="card animate-fade-up" id="chart-trend-card">
          <div class="card-header">
            <h2 class="card-title">30-Day Trend</h2>
            <span class="badge badge-info">Daily</span>
          </div>
          <div class="chart-container">
            <canvas id="trend-chart" aria-label="30-day emission trend chart"></canvas>
          </div>
        </div>
      </div>

      <!-- Comparison Section -->
      <div class="card animate-fade-up section" id="comparison-section" role="region" aria-label="Global comparison">
        <div class="card-header">
          <h2 class="card-title">How You Compare</h2>
        </div>
        <div class="gauge-container">
          <div class="gauge-value" aria-label="Projected annual emissions: ${comparison.yearlyProjectedTonnes.toFixed(1)} tonnes">${comparison.yearlyProjectedTonnes.toFixed(1)}</div>
          <div class="gauge-label">tonnes CO₂e/year (projected)</div>
          <div class="gauge-bar">
            <div class="gauge-fill" id="gauge-fill" style="width: ${Math.min(100, (comparison.yearlyProjectedTonnes / 15) * 100)}%; background: ${comparison.yearlyProjectedTonnes <= 4.7 ? 'var(--gradient-primary)' : comparison.yearlyProjectedTonnes <= 8 ? 'var(--color-warning-500)' : 'var(--color-danger-500)'}"></div>
          </div>
          <div class="gauge-markers">
            <span>0</span>
            <span>Global avg (4.7t)</span>
            <span>US avg (14.7t)</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section" role="region" aria-label="Quick actions">
        <div class="section-header">
          <h2 class="section-title">⚡ Quick Actions</h2>
        </div>
        <div class="dashboard-quick-actions">
          <button class="quick-action-btn" id="qa-calculator" type="button" aria-label="Open carbon calculator">
            <span class="quick-action-icon" aria-hidden="true">🧮</span>
            <span class="quick-action-label">Calculate Footprint</span>
          </button>
          <button class="quick-action-btn" id="qa-log-commute" type="button" aria-label="Log a commute activity">
            <span class="quick-action-icon" aria-hidden="true">🚗</span>
            <span class="quick-action-label">Log Commute</span>
          </button>
          <button class="quick-action-btn" id="qa-log-meal" type="button" aria-label="Log a meal activity">
            <span class="quick-action-icon" aria-hidden="true">🍽️</span>
            <span class="quick-action-label">Log Meal</span>
          </button>
          <button class="quick-action-btn" id="qa-set-goal" type="button" aria-label="Set a reduction goal">
            <span class="quick-action-icon" aria-hidden="true">🎯</span>
            <span class="quick-action-label">Set Goal</span>
          </button>
        </div>
      </div>

    </div>
  `;

  // Render charts after DOM is available
  requestAnimationFrame(() => {
    renderCharts();
    bindQuickActions();
  });
}

/**
 * Renders donut and trend charts.
 */
function renderCharts() {
  // Donut Chart
  const donutCanvas = document.getElementById('donut-chart');
  if (donutCanvas) {
    const breakdown = getCategoryBreakdown('month');
    const total = breakdown.reduce((sum, c) => sum + c.emission, 0);

    renderDonutChart(
      donutCanvas,
      breakdown.map((c) => ({ label: c.label, value: c.emission, color: c.color })),
      {
        centerText: total > 0 ? formatNumber(total) : '0',
        centerSubtext: 'kg CO₂',
      }
    );

    const legendContainer = document.getElementById('donut-legend');
    if (legendContainer) {
      renderLegend(
        legendContainer,
        breakdown.filter((c) => c.emission > 0).map((c) => ({ label: c.label, color: c.color, value: c.emission }))
      );
    }
  }

  // Line Chart
  const trendCanvas = document.getElementById('trend-chart');
  if (trendCanvas) {
    const trendData = getDailyTrend(30);
    renderLineChart(
      trendCanvas,
      trendData.map((d) => ({ date: d.date, value: d.emission })),
      { lineColor: '#10b561', showArea: true }
    );
  }
}

/**
 * Binds quick action button click handlers.
 */
function bindQuickActions() {
  document.getElementById('qa-calculator')?.addEventListener('click', () => navigate('#/calculator'));
  document.getElementById('qa-log-commute')?.addEventListener('click', () => navigate('#/activities'));
  document.getElementById('qa-log-meal')?.addEventListener('click', () => navigate('#/activities'));
  document.getElementById('qa-set-goal')?.addEventListener('click', () => navigate('#/goals'));
}
