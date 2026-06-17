/**
 * @fileoverview Goals page — set, track, and manage emission reduction goals.
 * @module GoalsPage
 */

import { escapeHtml } from '../utils/sanitize.js';
import { formatEmission, toISODate, generateId } from '../utils/helpers.js';
import { getTotalEmissions, getGoals, saveGoals } from '../services/carbon.service.js';
import { validateGoal } from '../services/validation.service.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';

/**
 * Renders the goals page.
 * @param {HTMLElement} container - Page container.
 */
export function render(container) {
  const goals = getGoals();
  const monthlyKg = getTotalEmissions('month');

  container.innerHTML = `
    <div class="animate-fade-up">
      <div class="page-header">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 class="page-title" id="goals-heading">Reduction Goals</h1>
            <p class="page-description">Set targets and track your progress toward a lower carbon footprint.</p>
          </div>
          <button class="btn btn-primary" id="add-goal-btn" type="button">
            ➕ New Goal
          </button>
        </div>
      </div>

      <div id="goals-container">
        ${goals.length > 0 ? renderGoalsList(goals, monthlyKg) : renderEmptyState()}
      </div>

      <!-- Goal Setting Guide -->
      <div class="card section animate-fade-up" style="margin-top: var(--space-8);" role="region" aria-label="Goal setting tips">
        <h2 class="card-title" style="margin-bottom: var(--space-4);">📖 How to Set Effective Goals</h2>
        <div class="grid-3 grid" style="gap: var(--space-4);">
          <div style="padding: var(--space-4);">
            <h3 style="font-size: var(--font-size-base); font-weight: 600; margin-bottom: var(--space-2); color: var(--color-primary-400);">🎯 Start Small</h3>
            <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">Aim for a 5-10% reduction first. Small, achievable goals build momentum and habits that last.</p>
          </div>
          <div style="padding: var(--space-4);">
            <h3 style="font-size: var(--font-size-base); font-weight: 600; margin-bottom: var(--space-2); color: var(--color-accent-400);">📅 Set Timeframes</h3>
            <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">Monthly goals keep you accountable. Quarterly goals help see bigger trends.</p>
          </div>
          <div style="padding: var(--space-4);">
            <h3 style="font-size: var(--font-size-base); font-weight: 600; margin-bottom: var(--space-2); color: var(--color-info-400);">📊 Track Consistently</h3>
            <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">Log activities daily for accurate tracking. Your goal progress updates automatically.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('add-goal-btn')?.addEventListener('click', () => openNewGoalModal(monthlyKg));
}

/**
 * Renders the goals list.
 * @param {Array<Object>} goals - Goal objects.
 * @param {number} monthlyKg - Current monthly emissions.
 * @returns {string} HTML string.
 */
function renderGoalsList(goals, monthlyKg) {
  return `
    <div class="goals-grid">
      ${goals.map((goal, i) => {
        const targetKg = goal.baselineKg * (1 - goal.targetPercent / 100);
        const currentProgress = goal.baselineKg > 0
          ? Math.max(0, ((goal.baselineKg - monthlyKg) / (goal.baselineKg - targetKg)) * 100)
          : 0;
        const progressClamped = Math.min(100, currentProgress);

        const startDate = new Date(goal.startDate);
        const endDate = new Date(goal.endDate);
        const now = new Date();
        const totalDays = Math.max(1, (endDate - startDate) / 86400000);
        const elapsedDays = Math.max(0, (now - startDate) / 86400000);
        const timeProgress = Math.min(100, (elapsedDays / totalDays) * 100);

        const isActive = now >= startDate && now <= endDate;
        const isCompleted = progressClamped >= 100;
        const isExpired = now > endDate && !isCompleted;

        return `
          <div class="card goal-card animate-fade-up" style="animation-delay: ${i * 100}ms;" role="region"
               aria-label="Goal: ${escapeHtml(goal.name)}">
            <div class="flex items-center justify-between" style="margin-bottom: var(--space-3);">
              <span class="badge ${isCompleted ? 'badge-primary' : isExpired ? 'badge-danger' : isActive ? 'badge-accent' : 'badge-info'}">
                ${isCompleted ? '✅ Achieved' : isExpired ? '⏰ Expired' : isActive ? '🔄 Active' : '⏳ Upcoming'}
              </span>
              <button class="btn btn-ghost btn-sm" data-delete-goal="${i}" type="button"
                      aria-label="Delete goal: ${escapeHtml(goal.name)}">🗑️</button>
            </div>

            <h3 style="font-size: var(--font-size-lg); font-weight: 700; margin-bottom: var(--space-2);">
              ${escapeHtml(goal.name)}
            </h3>

            <div class="goal-target">
              <span class="goal-percentage">${goal.targetPercent}%</span>
              <span class="goal-text">reduction target</span>
            </div>

            <div class="progress-container" role="progressbar" aria-valuenow="${progressClamped.toFixed(0)}"
                 aria-valuemin="0" aria-valuemax="100" aria-label="Goal progress: ${progressClamped.toFixed(0)}%">
              <div class="progress-bar-wrapper">
                <div class="progress-bar-fill" style="width: ${progressClamped}%;
                     background: ${isCompleted ? 'var(--gradient-primary)' : progressClamped > 50 ? 'var(--color-primary-500)' : 'var(--color-warning-500)'};">
                </div>
              </div>
              <div class="goal-progress-info">
                <span>${progressClamped.toFixed(0)}% achieved</span>
                <span>Target: ${escapeHtml(formatEmission(targetKg))}/month</span>
              </div>
            </div>

            <div class="divider" style="margin: var(--space-4) 0;"></div>

            <div class="flex justify-between" style="font-size: var(--font-size-xs); color: var(--text-tertiary);">
              <span>Baseline: ${escapeHtml(formatEmission(goal.baselineKg))}</span>
              <span>Current: ${escapeHtml(formatEmission(monthlyKg))}</span>
            </div>

            <div class="goal-milestones" style="margin-top: var(--space-3);">
              ${[25, 50, 75, 100].map((m) => `
                <div class="milestone ${progressClamped >= m ? 'reached' : ''}">
                  <span class="milestone-dot"></span>
                  <span>${m}%</span>
                </div>
              `).join('')}
            </div>

            <!-- Time Progress -->
            <div style="margin-top: var(--space-4);">
              <div class="flex justify-between" style="font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: var(--space-1);">
                <span>Time elapsed</span>
                <span>${timeProgress.toFixed(0)}%</span>
              </div>
              <div class="progress-bar-wrapper" style="height: 4px;">
                <div class="progress-bar-fill" style="width: ${timeProgress}%; background: var(--color-info-500);"></div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderEmptyState() {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">🎯</div>
      <h2 class="empty-state-title">No Goals Set Yet</h2>
      <p class="empty-state-text">Set your first reduction goal to start tracking your progress toward a sustainable lifestyle.</p>
    </div>
  `;
}

/**
 * Opens the new goal creation modal.
 * @param {number} monthlyKg - Current monthly emissions for baseline.
 */
function openNewGoalModal(monthlyKg) {
  const today = toISODate();
  const threeMonthsLater = toISODate(new Date(Date.now() + 90 * 86400000));

  const content = `
    <form id="goal-form" novalidate>
      <div class="form-group">
        <label class="form-label form-label-required" for="goal-name">Goal Name</label>
        <input class="form-input" type="text" id="goal-name" name="name"
               maxlength="100" required placeholder="e.g., Reduce Q3 emissions" />
      </div>

      <div class="form-group">
        <label class="form-label form-label-required" for="goal-percent">Reduction Target</label>
        <select class="form-select" id="goal-percent" name="targetPercent" required>
          <option value="5">5% — Easy Start</option>
          <option value="10" selected>10% — Moderate</option>
          <option value="15">15% — Ambitious</option>
          <option value="25">25% — Challenging</option>
          <option value="50">50% — Transformative</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="goal-baseline">Monthly Baseline (kg CO₂)</label>
        <input class="form-input" type="number" id="goal-baseline" name="baselineKg"
               min="0" max="100000" step="0.1" value="${monthlyKg.toFixed(1)}"
               aria-describedby="baseline-hint" />
        <span class="form-hint" id="baseline-hint">Auto-filled with your current monthly total</span>
      </div>

      <div class="grid-2 grid" style="gap: var(--space-4);">
        <div class="form-group">
          <label class="form-label form-label-required" for="goal-start">Start Date</label>
          <input class="form-input" type="date" id="goal-start" name="startDate" value="${today}" required />
        </div>
        <div class="form-group">
          <label class="form-label form-label-required" for="goal-end">End Date</label>
          <input class="form-input" type="date" id="goal-end" name="endDate" value="${threeMonthsLater}" required />
        </div>
      </div>

      <div id="goal-form-errors" role="alert" aria-live="polite"></div>
    </form>
  `;

  openModal({
    title: 'Create New Goal',
    content,
    actions: [
      { label: 'Cancel', variant: 'secondary', id: 'modal-cancel-goal', onClick: () => {} },
      {
        label: 'Create Goal',
        variant: 'primary',
        id: 'modal-create-goal',
        onClick: () => {
          // We handle this manually to validate first
        },
      },
    ],
  });

  // Override the create button to validate first
  requestAnimationFrame(() => {
    const createBtn = document.getElementById('modal-create-goal');
    if (createBtn) {
      // Remove the default click handler and add our own
      const newBtn = createBtn.cloneNode(true);
      createBtn.parentNode.replaceChild(newBtn, createBtn);

      newBtn.addEventListener('click', () => {
        const form = document.getElementById('goal-form');
        if (!form) { return; }

        const formData = new FormData(form);
        const goalData = {
          name: formData.get('name'),
          targetPercent: parseInt(formData.get('targetPercent'), 10),
          baselineKg: parseFloat(formData.get('baselineKg')),
          startDate: formData.get('startDate'),
          endDate: formData.get('endDate'),
        };

        const { valid, errors, sanitized } = validateGoal(goalData);
        const errorsDiv = document.getElementById('goal-form-errors');

        if (!valid) {
          if (errorsDiv) {
            errorsDiv.innerHTML = errors.map((e) => `<p class="form-error">⚠️ ${escapeHtml(e)}</p>`).join('');
          }
          return;
        }

        const goals = getGoals();
        goals.push({ ...sanitized, id: generateId() });
        saveGoals(goals);

        showToast({ title: 'Goal Created!', message: `Targeting ${sanitized.targetPercent}% reduction.`, type: 'success' });
        closeModal();

        // Re-render the goals page
        const container = document.getElementById('page-container');
        if (container) {
          render(container);
        }
      });
    }
  });

  // Bind delete buttons after render
  requestAnimationFrame(() => {
    document.querySelectorAll('[data-delete-goal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.deleteGoal, 10);
        openModal({
          title: 'Delete Goal',
          content: '<p style="color: var(--text-secondary);">Are you sure you want to delete this goal?</p>',
          actions: [
            { label: 'Cancel', variant: 'secondary', id: 'modal-cancel-delete-goal', onClick: () => {} },
            {
              label: 'Delete',
              variant: 'danger',
              id: 'modal-confirm-delete-goal',
              onClick: () => {
                const goals = getGoals();
                goals.splice(index, 1);
                saveGoals(goals);
                showToast({ title: 'Goal Deleted', type: 'info' });
                const container = document.getElementById('page-container');
                if (container) { render(container); }
              },
            },
          ],
        });
      });
    });
  });
}
