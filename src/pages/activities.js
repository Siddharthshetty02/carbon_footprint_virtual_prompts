/**
 * @fileoverview Activities page — log, view, edit, delete, and export activities.
 * @module ActivitiesPage
 */

import { escapeHtml } from '../utils/sanitize.js';
import { formatEmission, formatDate, formatRelativeTime, toISODate } from '../utils/helpers.js';
import { CATEGORIES } from '../utils/constants.js';
import {
  getActivities,
  addActivity,
  deleteActivity,
  updateActivity,
  getTypesForCategory,
  getTypeInfo,
  getCategoryIcon,
  getCategoryColor,
} from '../services/carbon.service.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';

let filterCategory = 'all';
let searchQuery = '';

/**
 * Renders the activities page.
 * @param {HTMLElement} container - Page container.
 */
export function render(container) {
  container.innerHTML = `
    <div class="animate-fade-up">
      <div class="page-header">
        <h1 class="page-title" id="activities-heading">Activity Log</h1>
        <p class="page-description">Track your daily carbon-producing activities. Every logged action helps build a clearer picture.</p>
      </div>

      <!-- Add Activity Form -->
      <div class="card section" id="add-activity-section" role="region" aria-label="Add new activity">
        <h2 class="card-title" style="margin-bottom: var(--space-4);">➕ Log Activity</h2>
        <form id="add-activity-form" novalidate>
          <div class="grid-2 grid" style="gap: var(--space-4);">
            <div class="form-group">
              <label class="form-label form-label-required" for="activity-category">Category</label>
              <select class="form-select" id="activity-category" name="category" required>
                <option value="">Select category...</option>
                ${Object.values(CATEGORIES).map((c) => `
                  <option value="${escapeHtml(c.id)}">${c.icon} ${escapeHtml(c.label)}</option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label form-label-required" for="activity-type">Type</label>
              <select class="form-select" id="activity-type" name="type" required disabled>
                <option value="">Select category first...</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label form-label-required" for="activity-quantity">Quantity</label>
              <input class="form-input" type="number" id="activity-quantity" name="quantity"
                     min="0" max="100000" step="0.1" required placeholder="e.g., 25" />
              <span class="form-hint" id="quantity-unit-hint">Select a type to see the unit</span>
            </div>

            <div class="form-group">
              <label class="form-label form-label-required" for="activity-date">Date</label>
              <input class="form-input" type="date" id="activity-date" name="date"
                     value="${toISODate()}" max="${toISODate()}" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="activity-note">Note (optional)</label>
            <input class="form-input" type="text" id="activity-note" name="note"
                   maxlength="200" placeholder="e.g., Commute to office" />
          </div>

          <div id="form-errors" role="alert" aria-live="polite"></div>

          <button class="btn btn-primary" type="submit" id="add-activity-btn" style="margin-top: var(--space-2);">
            Add Activity
          </button>
        </form>
      </div>

      <!-- Filters & Activity List -->
      <div class="section" role="region" aria-label="Activity history">
        <div class="activities-header">
          <h2 class="section-title">📋 History</h2>
          <div class="activity-filters" role="toolbar" aria-label="Filter activities">
            <button class="chip ${filterCategory === 'all' ? 'selected' : ''}" data-filter="all" type="button">All</button>
            ${Object.values(CATEGORIES).map((c) => `
              <button class="chip ${filterCategory === c.id ? 'selected' : ''}" data-filter="${escapeHtml(c.id)}" type="button">
                ${c.icon} ${escapeHtml(c.label)}
              </button>
            `).join('')}
          </div>
          <div class="flex items-center gap-3">
            <input class="form-input" type="search" id="activity-search" placeholder="Search activities..." value="${escapeHtml(searchQuery)}" aria-label="Search activities" style="width: 200px;" />
            <button class="btn btn-sm btn-secondary" id="export-csv-btn" type="button" aria-label="Export activities as CSV">
              📥 Export CSV
            </button>
          </div>
        </div>

        <div id="activity-list" class="activity-list" role="list" aria-label="Activity entries">
        </div>
      </div>
    </div>
  `;

  bindFormEvents();
  bindFilterEvents();
  renderActivityList();

  document.getElementById('export-csv-btn')?.addEventListener('click', exportCSV);
}

function bindFormEvents() {
  const categorySelect = document.getElementById('activity-category');
  const typeSelect = document.getElementById('activity-type');
  const form = document.getElementById('add-activity-form');

  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      const category = categorySelect.value;
      if (typeSelect) {
        if (!category) {
          typeSelect.innerHTML = '<option value="">Select category first...</option>';
          typeSelect.disabled = true;
          return;
        }

        const types = getTypesForCategory(category);
        typeSelect.innerHTML = `
          <option value="">Select type...</option>
          ${types.map((t) => `<option value="${escapeHtml(t.key)}">${escapeHtml(t.label)} (${t.factor} kg/${t.unit})</option>`).join('')}
        `;
        typeSelect.disabled = false;
      }
    });
  }

  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      const hint = document.getElementById('quantity-unit-hint');
      const category = categorySelect?.value;
      const type = typeSelect.value;
      if (hint && category && type) {
        const info = getTypeInfo(category, type);
        hint.textContent = `Enter amount in ${info.unit}`;
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = {
        category: formData.get('category'),
        type: formData.get('type'),
        quantity: parseFloat(formData.get('quantity')),
        date: formData.get('date'),
        note: formData.get('note') || '',
      };

      const result = addActivity(data);
      const errorsDiv = document.getElementById('form-errors');

      if (!result.success) {
        if (errorsDiv) {
          errorsDiv.innerHTML = result.errors.map((e) => `<p class="form-error">⚠️ ${escapeHtml(e)}</p>`).join('');
        }
        return;
      }

      if (errorsDiv) { errorsDiv.innerHTML = ''; }
      form.reset();
      document.getElementById('activity-date').value = toISODate();
      if (typeSelect) {
        typeSelect.innerHTML = '<option value="">Select category first...</option>';
        typeSelect.disabled = true;
      }

      showToast({ title: 'Activity Logged!', message: `${formatEmission(result.activity.emission)} added.`, type: 'success' });
      renderActivityList();
    });
  }
}

function bindFilterEvents() {
  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      filterCategory = btn.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      renderActivityList();
    });
  });

  const searchInput = document.getElementById('activity-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      renderActivityList();
    });
  }
}

function renderActivityList() {
  const listContainer = document.getElementById('activity-list');
  if (!listContainer) { return; }

  let activities = getActivities();
  if (filterCategory !== 'all') {
    activities = activities.filter((a) => a.category === filterCategory);
  }
  
  if (searchQuery) {
    activities = activities.filter((a) => {
      const info = getTypeInfo(a.category, a.type);
      const text = \`\${info.label} \${a.note || ''}\`.toLowerCase();
      return text.includes(searchQuery);
    });
  }

  if (activities.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3 class="empty-state-title">No Activities Yet</h3>
        <p class="empty-state-text">Start logging your daily activities using the form above to track your carbon footprint.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = activities.slice(0, 50).map((activity) => {
    const info = getTypeInfo(activity.category, activity.type);
    const icon = getCategoryIcon(activity.category);
    const color = getCategoryColor(activity.category);

    return `
      <div class="activity-item" role="listitem" data-id="${escapeHtml(activity.id)}">
        <div class="activity-category-icon" style="background: ${color}20; color: ${color};" aria-hidden="true">${icon}</div>
        <div class="activity-details">
          <div class="activity-name">${escapeHtml(info.label)}${activity.note ? ` — ${escapeHtml(activity.note)}` : ''}</div>
          <div class="activity-meta">
            <span>${escapeHtml(formatDate(activity.date, 'short'))}</span>
            <span>${activity.quantity} ${escapeHtml(info.unit)}</span>
            <span>${escapeHtml(formatRelativeTime(activity.createdAt))}</span>
          </div>
        </div>
        <span class="activity-emission" aria-label="${formatEmission(activity.emission)}">${escapeHtml(formatEmission(activity.emission))}</span>
        <div class="activity-actions">
          <button class="btn btn-ghost btn-sm edit-activity-btn" data-id="${escapeHtml(activity.id)}" type="button"
                  aria-label="Edit ${escapeHtml(info.label)} activity">✏️</button>
          <button class="btn btn-ghost btn-sm delete-activity-btn" data-id="${escapeHtml(activity.id)}" type="button"
                  aria-label="Delete ${escapeHtml(info.label)} activity">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  if (activities.length > 50) {
    listContainer.innerHTML += `<p style="text-align: center; color: var(--text-tertiary); font-size: var(--font-size-sm); padding: var(--space-4);">Showing 50 of ${activities.length} activities.</p>`;
  }

  // Bind delete buttons
  listContainer.querySelectorAll('.delete-activity-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      openModal({
        title: 'Delete Activity',
        content: '<p style="color: var(--text-secondary);">Are you sure you want to delete this activity? This action cannot be undone.</p>',
        actions: [
          { label: 'Cancel', variant: 'secondary', id: 'modal-cancel-delete', onClick: () => {} },
          {
            label: 'Delete',
            variant: 'danger',
            id: 'modal-confirm-delete',
            onClick: () => {
              deleteActivity(id);
              showToast({ title: 'Activity Deleted', type: 'info' });
              renderActivityList();
            },
          },
        ],
      });
    });
  });
  // Bind edit buttons
  listContainer.querySelectorAll('.edit-activity-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const activity = getActivities().find((a) => a.id === id);
      if (!activity) return;

      const types = getTypesForCategory(activity.category);
      
      const content = `
        <form id="edit-activity-form" novalidate>
          <div class="form-group">
            <label class="form-label form-label-required" for="edit-category">Category</label>
            <select class="form-select" id="edit-category" name="category" required>
              ${Object.values(CATEGORIES).map((c) => \`
                <option value="\${escapeHtml(c.id)}" \${c.id === activity.category ? 'selected' : ''}>\${c.icon} \${escapeHtml(c.label)}</option>
              \`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label form-label-required" for="edit-type">Type</label>
            <select class="form-select" id="edit-type" name="type" required>
              ${types.map((t) => \`<option value="\${escapeHtml(t.key)}" \${t.key === activity.type ? 'selected' : ''}>\${escapeHtml(t.label)} (\${t.factor} kg/\${t.unit})</option>\`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label form-label-required" for="edit-quantity">Quantity</label>
            <input class="form-input" type="number" id="edit-quantity" name="quantity"
                   min="0" max="100000" step="0.1" required value="${activity.quantity}" />
          </div>
          <div class="form-group">
            <label class="form-label form-label-required" for="edit-date">Date</label>
            <input class="form-input" type="date" id="edit-date" name="date"
                   value="${activity.date}" max="${toISODate()}" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-note">Note (optional)</label>
            <input class="form-input" type="text" id="edit-note" name="note"
                   maxlength="200" value="${escapeHtml(activity.note || '')}" />
          </div>
          <div id="edit-form-errors" role="alert" aria-live="polite"></div>
        </form>
      `;

      openModal({
        title: 'Edit Activity',
        content,
        actions: [
          { label: 'Cancel', variant: 'secondary', id: 'modal-cancel-edit', onClick: () => {} },
          {
            label: 'Save Changes',
            variant: 'primary',
            id: 'modal-confirm-edit',
            onClick: () => {}
          },
        ],
      });

      requestAnimationFrame(() => {
        const editCategory = document.getElementById('edit-category');
        const editType = document.getElementById('edit-type');
        if (editCategory && editType) {
          editCategory.addEventListener('change', () => {
            const cat = editCategory.value;
            const newTypes = getTypesForCategory(cat);
            editType.innerHTML = newTypes.map((t) => \`<option value="\${escapeHtml(t.key)}">\${escapeHtml(t.label)} (\${t.factor} kg/\${t.unit})</option>\`).join('');
          });
        }

        const confirmBtn = document.getElementById('modal-confirm-edit');
        if (confirmBtn) {
          const newBtn = confirmBtn.cloneNode(true);
          confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
          newBtn.addEventListener('click', () => {
            const form = document.getElementById('edit-activity-form');
            if (!form) return;
            const formData = new FormData(form);
            const updates = {
              category: formData.get('category'),
              type: formData.get('type'),
              quantity: parseFloat(formData.get('quantity')),
              date: formData.get('date'),
              note: formData.get('note') || '',
            };
            const result = updateActivity(id, updates);
            if (!result.success) {
              const errorsDiv = document.getElementById('edit-form-errors');
              if (errorsDiv) {
                errorsDiv.innerHTML = result.errors.map((e) => \`<p class="form-error">⚠️ \${escapeHtml(e)}</p>\`).join('');
              }
              return;
            }
            showToast({ title: 'Activity Updated', type: 'success' });
            closeModal();
            renderActivityList();
          });
        }
      });
    });
  });
}

function exportCSV() {
  const activities = getActivities();
  if (activities.length === 0) {
    showToast({ title: 'No Data', message: 'No activities to export.', type: 'warning' });
    return;
  }

  const headers = ['Date', 'Category', 'Type', 'Quantity', 'Unit', 'Emission (kg CO₂)', 'Note'];
  const rows = activities.map((a) => {
    const info = getTypeInfo(a.category, a.type);
    return [
      a.date,
      CATEGORIES[a.category]?.label || a.category,
      info.label,
      a.quantity,
      info.unit,
      (a.emission || 0).toFixed(2),
      `"${(a.note || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `carbonwise_activities_${toISODate()}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  showToast({ title: 'Export Complete', message: `${activities.length} activities exported.`, type: 'success' });
}
