/**
 * @fileoverview Modal dialog component with focus trapping.
 * WCAG-compliant: Escape to close, focus trap, role="dialog".
 * @module Modal
 */

import { escapeHtml } from '../utils/sanitize.js';

/** @type {HTMLElement|null} */
let previouslyFocused = null;

/** @type {Function|null} */
let keydownHandler = null;

/**
 * Opens a modal dialog.
 * @param {Object} options - Modal options.
 * @param {string} options.title - Modal title.
 * @param {string} options.content - Modal body HTML (must be pre-sanitized).
 * @param {Array<{label: string, variant?: string, id: string, onClick: Function}>} [options.actions] - Action buttons.
 * @param {Function} [options.onClose] - Callback when modal is closed.
 */
export function openModal({ title, content, actions = [], onClose }) {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    return;
  }

  // Remember current focus
  previouslyFocused = document.activeElement;

  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" id="modal-dialog">
      <div class="modal-header">
        <h2 class="modal-title" id="modal-title">${escapeHtml(title)}</h2>
        <button class="modal-close touch-target" id="modal-close-btn" type="button" aria-label="Close dialog">✕</button>
      </div>
      <div class="modal-body" id="modal-body">
        ${content}
      </div>
      ${actions.length > 0 ? `
        <div class="modal-actions">
          ${actions.map((action) => `
            <button class="btn ${action.variant ? `btn-${action.variant}` : 'btn-secondary'}"
                    id="${escapeHtml(action.id)}"
                    type="button">
              ${escapeHtml(action.label)}
            </button>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');

  // Bind close button
  const closeBtn = document.getElementById('modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal(onClose));
  }

  // Bind action buttons
  actions.forEach((action) => {
    const btn = document.getElementById(action.id);
    if (btn) {
      btn.addEventListener('click', () => {
        if (action.onClick) {
          action.onClick();
        }
        closeModal(onClose);
      });
    }
  });

  // Close on overlay click (outside modal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal(onClose);
    }
  }, { once: true });

  // Keyboard: Escape to close, Tab trap
  keydownHandler = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal(onClose);
      return;
    }

    if (e.key === 'Tab') {
      trapFocus(e);
    }
  };
  document.addEventListener('keydown', keydownHandler);

  // Focus the first focusable element
  requestAnimationFrame(() => {
    const dialog = document.getElementById('modal-dialog');
    if (dialog) {
      const firstFocusable = dialog.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  });
}

/**
 * Closes the currently open modal.
 * @param {Function} [callback] - Optional callback after close.
 */
export function closeModal(callback) {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    return;
  }

  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = '';

  // Remove keyboard handler
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }

  // Restore focus
  if (previouslyFocused && previouslyFocused.focus) {
    previouslyFocused.focus();
    previouslyFocused = null;
  }

  if (callback) {
    callback();
  }
}

/**
 * Traps keyboard focus within the modal dialog.
 * @param {KeyboardEvent} e - The keydown event.
 */
function trapFocus(e) {
  const dialog = document.getElementById('modal-dialog');
  if (!dialog) {
    return;
  }

  const focusableElements = dialog.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) {
    return;
  }

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    }
  } else {
    if (document.activeElement === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  }
}
