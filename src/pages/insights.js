/**
 * @fileoverview Insights page — personalized tips, achievements, and educational facts.
 * @module InsightsPage
 */

import { escapeHtml } from '../utils/sanitize.js';
import { formatEmission } from '../utils/helpers.js';
import { getCategoryBreakdown } from '../services/carbon.service.js';
import {
  getPersonalizedTips,
  checkAchievements,
  getRandomFact,
  getTrend,
  getCategoryInsight,
} from '../services/insights.service.js';
import { renderBarChart } from '../services/chart.service.js';

/**
 * Renders the insights page.
 * @param {HTMLElement} container - Page container.
 */
export function render(container) {
  const tips = getPersonalizedTips(8);
  const achievements = checkAchievements();
  const fact = getRandomFact();
  const trend = getTrend();
  const breakdown = getCategoryBreakdown('month');
  
  const topCategory = breakdown.filter((c) => c.emission > 0).sort((a, b) => b.emission - a.emission)[0];
  let deepDiveHtml = '';
  if (topCategory) {
    const insight = getCategoryInsight(topCategory.category);
    if (insight && insight.topTypes.length > 0) {
      deepDiveHtml = `
        <div class="card" style="margin-bottom: var(--space-6);" role="region" aria-label="Category Deep Dive">
          <h3 class="card-title" style="margin-bottom: var(--space-3);">🔍 Deep Dive: ${insight.category.icon} ${escapeHtml(insight.category.label)}</h3>
          <p style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--space-3);">
            Highest emission source this month (${escapeHtml(formatEmission(insight.monthlyEmission))}).
          </p>
          <div>
            <h4 style="font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); margin-bottom: var(--space-2);">Top Sources</h4>
            <ul style="list-style: none; padding-left: 0;">
              ${insight.topTypes.slice(0, 3).map((t) => `
                <li style="font-size: var(--font-size-sm); margin-bottom: var(--space-1); display: flex; justify-content: space-between;">
                  <span>${escapeHtml(t.type.replace('_', ' '))}</span>
                  <span style="font-weight: 600;">${escapeHtml(formatEmission(t.totalEmission))}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      `;
    }
  }

  container.innerHTML = `
    <div class="animate-fade-up">
      <div class="page-header">
        <h1 class="page-title" id="insights-heading">Insights & Tips</h1>
        <p class="page-description">Personalized recommendations based on your activity data. Higher impact tips are shown first.</p>
      </div>

      <!-- Trend Summary -->
      <div class="card section animate-fade-up" role="region" aria-label="Trend summary">
        <div class="card-header">
          <h2 class="card-title">📈 Monthly Trend</h2>
          <span class="badge ${trend.direction === 'improving' ? 'badge-primary' : trend.direction === 'worsening' ? 'badge-danger' : 'badge-info'}">
            ${trend.direction === 'improving' ? '↓ Improving' : trend.direction === 'worsening' ? '↑ Rising' : '→ Stable'}
          </span>
        </div>
        <div class="flex gap-6 flex-wrap" style="margin-top: var(--space-4);">
          <div>
            <div class="card-label">This Month</div>
            <div style="font-size: var(--font-size-xl); font-weight: 700;">${escapeHtml(formatEmission(trend.currentKg))}</div>
          </div>
          <div>
            <div class="card-label">Last Month</div>
            <div style="font-size: var(--font-size-xl); font-weight: 700; color: var(--text-secondary);">${escapeHtml(formatEmission(trend.previousKg))}</div>
          </div>
          ${trend.percentChange !== 0 ? `
          <div>
            <div class="card-label">Change</div>
            <div style="font-size: var(--font-size-xl); font-weight: 700; color: ${trend.percentChange < 0 ? 'var(--color-primary-400)' : 'var(--color-danger-400)'};">
              ${trend.percentChange > 0 ? '+' : ''}${trend.percentChange.toFixed(1)}%
            </div>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="insights-grid">
        <!-- Tips Column -->
        <div>
          <div class="section-header">
            <h2 class="section-title">💡 Personalized Tips</h2>
          </div>

          ${tips.length > 0 ? tips.map((tip, i) => `
            <div class="insight-card animate-fade-up" style="margin-bottom: var(--space-4); animation-delay: ${i * 80}ms;">
              <div class="flex items-center gap-3" style="margin-bottom: var(--space-3);">
                <span class="insight-impact impact-${tip.impact}" aria-label="${tip.impact} impact">
                  ${tip.impact === 'high' ? '🔥 High Impact' : tip.impact === 'medium' ? '⚡ Medium Impact' : '💧 Low Impact'}
                </span>
                <span class="badge badge-${tip.category === 'transport' ? 'info' : tip.category === 'energy' ? 'warning' : tip.category === 'food' ? 'primary' : tip.category === 'shopping' ? 'accent' : 'danger'}">
                  ${escapeHtml(tip.categoryIcon)} ${escapeHtml(tip.categoryLabel)}
                </span>
              </div>
              <h3 class="insight-title">${escapeHtml(tip.title)}</h3>
              <p class="insight-description">${escapeHtml(tip.description)}</p>
              <div class="insight-savings">
                💚 Potential savings: ~${escapeHtml(formatEmission(tip.savingsKg))}/year
              </div>
            </div>
          `).join('') : `
            <div class="empty-state" style="padding: var(--space-8);">
              <div class="empty-state-icon">💡</div>
              <h3 class="empty-state-title">Log More Activities</h3>
              <p class="empty-state-text">Log some activities to receive personalized reduction tips.</p>
            </div>
          `}
        </div>

        <!-- Sidebar -->
        <div>
          <!-- Category Breakdown Chart -->
          <div class="card" style="margin-bottom: var(--space-6);" role="region" aria-label="Category comparison">
            <h3 class="card-title" style="margin-bottom: var(--space-4);">Category Comparison</h3>
            <div class="chart-container" style="aspect-ratio: 4/3; min-height: 200px;">
              <canvas id="bar-chart" role="img" aria-label="Category emission comparison bar chart"></canvas>
            </div>
          </div>

          ${deepDiveHtml}

          <!-- Did You Know -->
          <div class="fact-card" role="region" aria-label="Environmental fact" style="margin-bottom: var(--space-6);">
            <h3 class="card-title" style="margin-bottom: var(--space-3);">💬 Did You Know?</h3>
            <p class="fact-text">${escapeHtml(fact.text)}</p>
            <p class="fact-source">Source: ${escapeHtml(fact.source)}</p>
          </div>

          <!-- Achievements -->
          <div role="region" aria-label="Achievements">
            <h3 class="section-title" style="margin-bottom: var(--space-4);">🏅 Achievements</h3>
            <div class="achievements-grid">
              ${achievements.map((ach) => `
                <div class="achievement ${ach.unlocked ? 'unlocked' : 'locked'}"
                     aria-label="${escapeHtml(ach.name)}: ${ach.unlocked ? 'Unlocked' : `${ach.progress.toFixed(0)}% progress`}">
                  <span class="achievement-icon">${ach.icon}</span>
                  <span class="achievement-name">${escapeHtml(ach.name)}</span>
                  <span class="achievement-desc">${escapeHtml(ach.description)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Render bar chart
  requestAnimationFrame(() => {
    const barCanvas = document.getElementById('bar-chart');
    if (barCanvas) {
      const chartData = breakdown
        .filter((c) => c.emission > 0)
        .sort((a, b) => b.emission - a.emission)
        .map((c) => ({ label: c.label, value: c.emission, color: c.color }));

      if (chartData.length > 0) {
        renderBarChart(barCanvas, chartData);
      }
    }
  });
}
