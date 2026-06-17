/**
 * @fileoverview Toast notification component.
 * Accessible toast with auto-dismiss and role="alert".
 * @module Toast
 */

import { escapeHtml } from '../utils/sanitize.js';

/** @type {number} Default auto-dismiss duration in ms. */
const DEFAULT_DURATION = 4000;

/**
 * Toast icon map by type.
 * @type {Record<string, string>}
 */
const TOAST_ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

/**
 * Shows a toast notification.
 * @param {Object} options - Toast options.
 * @param {string} options.title - Toast title.
 * @param {string} [options.message] - Toast message body.
 * @param {'success'|'error'|'warning'|'info'} [options.type='info'] - Toast type.
 * @param {number} [options.duration=4000] - Auto-dismiss duration in ms. Set to 0 to disable.
 */
export function showToast({ title, message = '', type = 'info', duration = DEFAULT_DURATION }) {
  const container = document.getElementById('toast-container');
  if (!container) {
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');

  const icon = TOAST_ICONS[type] || TOAST_ICONS.info;

  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icon}</span>
    <div class="toast-body">
      <div class="toast-title">${escapeHtml(title)}</div>
      ${message ? `<div class="toast-message">${escapeHtml(message)}</div>` : ''}
    </div>
    <button class="toast-close touch-target" aria-label="Dismiss notification" type="button">✕</button>
  `;

  // Close button handler
  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => dismissToast(toast));
  }

  container.appendChild(toast);

  // Auto-dismiss
  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }
}

/**
 * Dismisses a toast with exit animation.
 * @param {HTMLElement} toast - Toast element to dismiss.
 */
function dismissToast(toast) {
  if (!toast || !toast.parentNode) {
    return;
  }
  toast.classList.add('toast-exit');
  toast.addEventListener('animationend', () => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, { once: true });

  // Fallback removal in case animation doesn't fire
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 500);
}
