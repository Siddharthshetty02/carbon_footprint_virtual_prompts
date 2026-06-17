/**
 * @fileoverview Hash-based SPA router with lazy-loaded page modules.
 * Manages focus on navigation for screen reader accessibility.
 * @module Router
 */

import { updateActiveLink } from './components/navbar.js';

/**
 * Route definition.
 * @typedef {{path: string, title: string, loader: () => Promise<{render: Function}>}} Route
 */

/**
 * Registered routes.
 * Lazy-loaded via dynamic imports for code splitting and efficiency.
 * @type {Route[]}
 */
const routes = [
  {
    path: '#/',
    title: 'Dashboard — CarbonWise',
    loader: () => import('./pages/dashboard.js'),
  },
  {
    path: '#/calculator',
    title: 'Carbon Calculator — CarbonWise',
    loader: () => import('./pages/calculator.js'),
  },
  {
    path: '#/activities',
    title: 'Activity Log — CarbonWise',
    loader: () => import('./pages/activities.js'),
  },
  {
    path: '#/insights',
    title: 'Insights & Tips — CarbonWise',
    loader: () => import('./pages/insights.js'),
  },
  {
    path: '#/goals',
    title: 'Reduction Goals — CarbonWise',
    loader: () => import('./pages/goals.js'),
  },
];

/** @type {Route|null} */
let currentRoute = null;

/** Page module cache for performance. */
const moduleCache = new Map();

/**
 * Initializes the router and starts listening for hash changes.
 */
export function initRouter() {
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange();
}

/**
 * Handles hash changes and renders the corresponding page.
 */
async function handleRouteChange() {
  const hash = window.location.hash || '#/';
  const route = routes.find((r) => r.path === hash) || routes[0];

  // Don't re-render if same route
  if (currentRoute && currentRoute.path === route.path) {
    return;
  }

  currentRoute = route;

  // Update page title for SEO and screen readers
  document.title = route.title;

  // Update navbar active state
  updateActiveLink();

  // Get page container
  const container = document.getElementById('page-container');
  if (!container) {
    return;
  }

  // Show loading indicator briefly
  container.innerHTML = `
    <div class="loading-screen" role="status" aria-label="Loading page">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
    </div>
  `;

  try {
    // Lazy load the page module (with caching)
    let pageModule = moduleCache.get(route.path);
    if (!pageModule) {
      pageModule = await route.loader();
      moduleCache.set(route.path, pageModule);
    }

    // Render the page
    if (pageModule && typeof pageModule.render === 'function') {
      container.innerHTML = '';
      pageModule.render(container);
    }
  } catch (error) {
    console.error('Router: Failed to load page', error);
    container.innerHTML = `
      <div class="empty-state" role="alert">
        <div class="empty-state-icon">⚠️</div>
        <h2 class="empty-state-title">Page Load Error</h2>
        <p class="empty-state-text">Failed to load this page. Please try refreshing.</p>
        <button class="btn btn-primary" onclick="location.reload()" id="reload-btn">Reload</button>
      </div>
    `;
  }

  // Move focus to main content for screen readers
  const main = document.getElementById('main-content');
  if (main) {
    main.focus({ preventScroll: true });
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/**
 * Programmatically navigates to a route.
 * @param {string} path - Hash path to navigate to (e.g., '#/calculator').
 */
export function navigate(path) {
  window.location.hash = path;
}
