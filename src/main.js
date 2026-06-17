/**
 * @fileoverview Application entry point.
 * Initializes navbar, theme, router, and global event listeners.
 * @module main
 */

import { renderNavbar, applySavedTheme } from './components/navbar.js';
import { initRouter } from './router.js';

/**
 * Bootstraps the CarbonWise application.
 * Called when the DOM is ready.
 */
function initApp() {
  // Apply saved theme preference
  applySavedTheme();

  // Render navigation
  const navContainer = document.getElementById('app-header');
  if (navContainer) {
    renderNavbar(navContainer);
  }

  // Initialize router (renders the current page)
  initRouter();

  // Hide loading screen once app is initialized
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.remove();
  }

  console.info('🌿 CarbonWise initialized successfully.');
}

// Bootstrap when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
