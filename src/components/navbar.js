/**
 * @fileoverview Navigation bar component with responsive mobile menu.
 * Fully keyboard-accessible with ARIA attributes.
 * @module Navbar
 */

import { escapeHtml } from '../utils/sanitize.js';

/**
 * Navigation route definitions.
 * @type {Array<{path: string, label: string, icon: string}>}
 */
const NAV_ROUTES = [
  { path: '#/', label: 'Dashboard', icon: '📊' },
  { path: '#/calculator', label: 'Calculator', icon: '🧮' },
  { path: '#/activities', label: 'Activities', icon: '📝' },
  { path: '#/insights', label: 'Insights', icon: '💡' },
  { path: '#/goals', label: 'Goals', icon: '🎯' },
];

/** @type {boolean} */
let mobileMenuOpen = false;

/**
 * Renders the navigation bar into the target container.
 * @param {HTMLElement} container - Nav container element.
 */
export function renderNavbar(container) {
  if (!container) {
    return;
  }

  const currentHash = window.location.hash || '#/';

  container.innerHTML = `
    <div class="navbar">
      <div class="navbar-inner">
        <a href="#/" class="navbar-brand" aria-label="CarbonWise Home">
          <span class="navbar-brand-icon" aria-hidden="true">🌿</span>
          <span class="navbar-brand-text">CarbonWise</span>
        </a>

        <div class="navbar-links" id="desktop-nav" role="menubar" aria-label="Main navigation">
          ${NAV_ROUTES.map((route) => `
            <a href="${escapeHtml(route.path)}"
               class="navbar-link ${currentHash === route.path ? 'active' : ''}"
               role="menuitem"
               aria-current="${currentHash === route.path ? 'page' : 'false'}"
               id="nav-link-${escapeHtml(route.label.toLowerCase())}">
              <span aria-hidden="true">${route.icon}</span>
              <span>${escapeHtml(route.label)}</span>
            </a>
          `).join('')}
        </div>

        <div class="navbar-actions">
          <a href="https://github.com/Siddharthshetty02/carbon_footprint_virtual_prompts" 
             target="_blank" 
             rel="noopener noreferrer" 
             class="btn btn-sm btn-ghost" 
             style="text-decoration: none; display: flex; align-items: center; gap: 6px; margin-right: var(--space-2);"
             title="View Source Code on GitHub">
            <span aria-hidden="true">💻</span>
            <span style="font-size: var(--font-size-sm); font-weight: 500;" class="hide-mobile">View Source Code</span>
          </a>

          <button class="theme-toggle touch-target"
                  id="theme-toggle-btn"
                  type="button"
                  aria-label="Toggle dark/light theme"
                  title="Toggle theme">
            <span id="theme-icon" aria-hidden="true">🌙</span>
          </button>

          <button class="navbar-toggle touch-target"
                  id="mobile-menu-toggle"
                  type="button"
                  aria-label="Toggle navigation menu"
                  aria-expanded="false"
                  aria-controls="mobile-menu">
            <span aria-hidden="true" id="menu-icon">☰</span>
          </button>
        </div>
      </div>
    </div>

    <div class="mobile-menu" id="mobile-menu" role="menu" aria-label="Mobile navigation">
      ${NAV_ROUTES.map((route) => `
        <a href="${escapeHtml(route.path)}"
           class="navbar-link ${currentHash === route.path ? 'active' : ''}"
           role="menuitem"
           aria-current="${currentHash === route.path ? 'page' : 'false'}">
          <span aria-hidden="true">${route.icon}</span>
          <span>${escapeHtml(route.label)}</span>
        </a>
      `).join('')}
    </div>
  `;

  // Event listeners
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenuOpen = !mobileMenuOpen;
      mobileMenu.classList.toggle('open', mobileMenuOpen);
      mobileToggle.setAttribute('aria-expanded', String(mobileMenuOpen));
      const menuIcon = document.getElementById('menu-icon');
      if (menuIcon) {
        menuIcon.textContent = mobileMenuOpen ? '✕' : '☰';
      }
    });

    // Close mobile menu on link click
    mobileMenu.querySelectorAll('.navbar-link').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenuOpen = false;
        mobileMenu.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        const menuIcon = document.getElementById('menu-icon');
        if (menuIcon) {
          menuIcon.textContent = '☰';
        }
      });
    });
  }

  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Update theme icon based on current theme
  updateThemeIcon();
}

/**
 * Updates the active navigation link based on current hash.
 */
export function updateActiveLink() {
  const currentHash = window.location.hash || '#/';
  document.querySelectorAll('.navbar-link').forEach((link) => {
    const isActive = link.getAttribute('href') === currentHash;
    link.classList.toggle('active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

/**
 * Toggles between dark and light themes.
 */
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);

  try {
    localStorage.setItem('cw_theme', next);
  } catch {
    // Silently fail if storage is not available
  }

  updateThemeIcon();
}

/**
 * Updates the theme toggle icon to match current theme.
 */
function updateThemeIcon() {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    const theme = document.documentElement.getAttribute('data-theme');
    icon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
}

/**
 * Applies the saved theme preference on load.
 */
export function applySavedTheme() {
  try {
    const saved = localStorage.getItem('cw_theme');
    if (saved && ['dark', 'light'].includes(saved)) {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch {
    // Default to dark theme
  }
}
