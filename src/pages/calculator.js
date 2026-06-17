/**
 * @fileoverview Carbon Footprint Calculator — multi-step wizard.
 * @module CalculatorPage
 */

import { escapeHtml } from '../utils/sanitize.js';
import { sanitizeNumber } from '../utils/sanitize.js';
import { formatEmission } from '../utils/helpers.js';
import { CATEGORIES, TRANSPORT_FACTORS } from '../utils/constants.js';
import { computeFootprint, saveCalculatorResults, getCalculatorResults } from '../services/carbon.service.js';
import { showToast } from '../components/toast.js';
import { navigate } from '../router.js';

const STEPS = ['transport', 'energy', 'food', 'lifestyle'];
const STEP_LABELS = { transport: 'Transport', energy: 'Energy', food: 'Food', lifestyle: 'Lifestyle' };
const STEP_ICONS = { transport: '🚗', energy: '⚡', food: '🍽️', lifestyle: '🛍️' };

let currentStep = 0;
let responses = {};

/**
 * Renders the calculator page.
 * @param {HTMLElement} container - Page container.
 */
export function render(container) {
  currentStep = 0;
  responses = {};

  // Check for existing results
  const existing = getCalculatorResults();

  container.innerHTML = `
    <div class="animate-fade-up">
      <div class="page-header">
        <h1 class="page-title" id="calculator-heading">Carbon Calculator</h1>
        <p class="page-description">Estimate your annual carbon footprint in 4 simple steps. Your data stays on your device.</p>
      </div>
      ${existing ? `
        <div class="card" style="margin-bottom: var(--space-6);">
          <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">
            ✅ You completed a calculation on ${escapeHtml(new Date(existing.completedAt).toLocaleDateString())}. 
            Your result was <strong>${escapeHtml(formatEmission(existing.totalKg))}</strong>/year.
            Recalculate below to update.
          </p>
        </div>
      ` : ''}
      <div class="calculator-wizard" id="calculator-wizard">
        <div id="wizard-steps-indicator" role="navigation" aria-label="Calculator progress"></div>
        <div id="wizard-panel" role="form" aria-label="Calculator form"></div>
      </div>
    </div>
  `;

  renderStepIndicator();
  renderCurrentStep();
}

function renderStepIndicator() {
  const indicator = document.getElementById('wizard-steps-indicator');
  if (!indicator) { return; }

  indicator.innerHTML = `
    <div class="wizard-steps">
      ${STEPS.map((step, i) => `
        <div class="wizard-step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}" aria-current="${i === currentStep ? 'step' : 'false'}">
          <span class="wizard-step-number">${i < currentStep ? '✓' : i + 1}</span>
          <span class="wizard-step-label">${escapeHtml(STEP_LABELS[step])}</span>
        </div>
        ${i < STEPS.length - 1 ? `<span class="wizard-step-connector ${i < currentStep ? 'completed' : ''}"></span>` : ''}
      `).join('')}
    </div>
  `;
}

function renderCurrentStep() {
  const panel = document.getElementById('wizard-panel');
  if (!panel) { return; }

  const step = STEPS[currentStep];

  switch (step) {
    case 'transport':
      panel.innerHTML = renderTransportStep();
      break;
    case 'energy':
      panel.innerHTML = renderEnergyStep();
      break;
    case 'food':
      panel.innerHTML = renderFoodStep();
      break;
    case 'lifestyle':
      panel.innerHTML = renderLifestyleStep();
      break;
  }

  // Add navigation buttons
  panel.innerHTML += renderWizardActions();

  // Bind events
  bindStepEvents();
  bindNavigation();
  updatePreview();
}

function renderTransportStep() {
  const carTypes = Object.entries(TRANSPORT_FACTORS)
    .filter(([key]) => key.startsWith('car_'))
    .map(([key, val]) => `<option value="${escapeHtml(key)}" ${responses.carType === key ? 'selected' : ''}>${escapeHtml(val.label)}</option>`)
    .join('');

  return `
    <div class="card wizard-panel" aria-labelledby="step-transport-title">
      <h2 id="step-transport-title" class="section-title">${STEP_ICONS.transport} Transport</h2>
      <p class="section-subtitle">Tell us about your typical commute and travel habits.</p>
      <div class="divider"></div>

      <div class="form-group">
        <label class="form-label" for="calc-car-type">Primary vehicle type</label>
        <select class="form-select" id="calc-car-type" name="carType">
          <option value="">No car</option>
          ${carTypes}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="calc-car-km">Weekly driving distance (km)</label>
        <input class="form-input" type="number" id="calc-car-km" name="carKmPerWeek"
               min="0" max="5000" step="5" value="${responses.carKmPerWeek || 0}"
               placeholder="e.g., 100" aria-describedby="car-km-hint" />
        <span class="form-hint" id="car-km-hint">Average commute + errands per week</span>
      </div>

      <div class="form-group">
        <label class="form-label" for="calc-public-transit">Weekly public transit (km)</label>
        <input class="form-input" type="number" id="calc-public-transit" name="publicTransitKmPerWeek"
               min="0" max="2000" step="5" value="${responses.publicTransitKmPerWeek || 0}"
               placeholder="e.g., 30" />
      </div>

      <div class="grid-2 grid" style="gap: var(--space-4);">
        <div class="form-group">
          <label class="form-label" for="calc-short-flights">Short flights/year (&lt;1500km)</label>
          <input class="form-input" type="number" id="calc-short-flights" name="shortFlightsPerYear"
                 min="0" max="100" value="${responses.shortFlightsPerYear || 0}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="calc-long-flights">Long flights/year (&gt;4000km)</label>
          <input class="form-input" type="number" id="calc-long-flights" name="longFlightsPerYear"
                 min="0" max="50" value="${responses.longFlightsPerYear || 0}" />
        </div>
      </div>

      <div class="calculator-preview" id="step-preview" aria-live="polite">
        <div class="calculator-preview-value" id="preview-value">—</div>
        <div class="calculator-preview-unit">estimated kg CO₂/year from transport</div>
      </div>
    </div>
  `;
}

function renderEnergyStep() {
  return `
    <div class="card wizard-panel" aria-labelledby="step-energy-title">
      <h2 id="step-energy-title" class="section-title">${STEP_ICONS.energy} Energy</h2>
      <p class="section-subtitle">Your household electricity and heating usage.</p>
      <div class="divider"></div>

      <div class="form-group">
        <label class="form-label" for="calc-electricity">Monthly electricity usage (kWh)</label>
        <input class="form-input" type="number" id="calc-electricity" name="electricityKwh"
               min="0" max="10000" step="10" value="${responses.electricityKwh || 300}"
               aria-describedby="elec-hint" />
        <span class="form-hint" id="elec-hint">US average is ~900 kWh/month, EU average is ~300 kWh/month</span>
      </div>

      <div class="form-group">
        <label class="form-label" for="calc-gas">Monthly natural gas (m³)</label>
        <input class="form-input" type="number" id="calc-gas" name="gasM3"
               min="0" max="1000" step="5" value="${responses.gasM3 || 0}" />
      </div>

      <div class="form-group">
        <label class="form-label" for="calc-renewable">Renewable energy percentage</label>
        <div class="flex items-center gap-4">
          <input class="form-range" type="range" id="calc-renewable" name="renewablePercent"
                 min="0" max="100" step="5" value="${responses.renewablePercent || 0}"
                 aria-describedby="renewable-hint" aria-valuemin="0" aria-valuemax="100"
                 aria-valuenow="${responses.renewablePercent || 0}" />
          <span id="renewable-display" style="min-width: 40px; font-weight: 600; color: var(--color-primary-400);">${responses.renewablePercent || 0}%</span>
        </div>
        <span class="form-hint" id="renewable-hint">Percentage of electricity from renewable sources</span>
      </div>

      <div class="calculator-preview" id="step-preview" aria-live="polite">
        <div class="calculator-preview-value" id="preview-value">—</div>
        <div class="calculator-preview-unit">estimated kg CO₂/year from energy</div>
      </div>
    </div>
  `;
}

function renderFoodStep() {
  const diets = [
    { value: 'heavy_meat', label: '🥩 Heavy Meat Eater', desc: 'Meat with most meals' },
    { value: 'medium_meat', label: '🍖 Average', desc: 'Meat a few times a week' },
    { value: 'light_meat', label: '🍗 Light Meat Eater', desc: 'Meat once or twice a week' },
    { value: 'pescatarian', label: '🐟 Pescatarian', desc: 'Fish but no other meat' },
    { value: 'vegetarian', label: '🥗 Vegetarian', desc: 'No meat or fish' },
    { value: 'vegan', label: '🌱 Vegan', desc: 'No animal products' },
  ];

  return `
    <div class="card wizard-panel" aria-labelledby="step-food-title">
      <h2 id="step-food-title" class="section-title">${STEP_ICONS.food} Food & Diet</h2>
      <p class="section-subtitle">Your dietary habits significantly impact your carbon footprint.</p>
      <div class="divider"></div>

      <div class="form-group">
        <fieldset>
          <legend class="form-label">What best describes your diet?</legend>
          <div class="flex flex-col gap-3" style="margin-top: var(--space-3);">
            ${diets.map((diet) => `
              <label class="chip ${responses.dietType === diet.value ? 'selected' : ''}" style="display: flex; padding: var(--space-3) var(--space-4); cursor: pointer;">
                <input type="radio" name="dietType" value="${diet.value}"
                       ${responses.dietType === diet.value ? 'checked' : ''}
                       class="sr-only" />
                <span style="flex: 1;">
                  <strong>${diet.label}</strong>
                  <span style="display: block; font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 2px;">${diet.desc}</span>
                </span>
              </label>
            `).join('')}
          </div>
        </fieldset>
      </div>

      <div class="form-group">
        <label class="form-label" for="calc-food-waste">Food waste per week (kg)</label>
        <input class="form-input" type="number" id="calc-food-waste" name="foodWasteKgPerWeek"
               min="0" max="50" step="0.5" value="${responses.foodWasteKgPerWeek || 1}" />
      </div>

      <div class="calculator-preview" id="step-preview" aria-live="polite">
        <div class="calculator-preview-value" id="preview-value">—</div>
        <div class="calculator-preview-unit">estimated kg CO₂/year from food</div>
      </div>
    </div>
  `;
}

function renderLifestyleStep() {
  return `
    <div class="card wizard-panel" aria-labelledby="step-lifestyle-title">
      <h2 id="step-lifestyle-title" class="section-title">${STEP_ICONS.lifestyle} Shopping & Waste</h2>
      <p class="section-subtitle">Your consumption and waste habits.</p>
      <div class="divider"></div>

      <div class="form-group">
        <label class="form-label" for="calc-clothing">New clothing items per month</label>
        <input class="form-input" type="number" id="calc-clothing" name="newClothingPerMonth"
               min="0" max="100" value="${responses.newClothingPerMonth || 2}" />
      </div>

      <div class="form-group">
        <label class="form-label" for="calc-online">Online orders per month</label>
        <input class="form-input" type="number" id="calc-online" name="onlineOrdersPerMonth"
               min="0" max="200" value="${responses.onlineOrdersPerMonth || 4}" />
      </div>

      <div class="form-group">
        <label class="form-label" for="calc-waste">Total waste per week (kg)</label>
        <input class="form-input" type="number" id="calc-waste" name="wasteKgPerWeek"
               min="0" max="100" step="0.5" value="${responses.wasteKgPerWeek || 5}"
               aria-describedby="waste-hint" />
        <span class="form-hint" id="waste-hint">Average US household: ~10 kg/week per person</span>
      </div>

      <div class="form-group">
        <label class="form-label" for="calc-recycling">Recycling percentage</label>
        <div class="flex items-center gap-4">
          <input class="form-range" type="range" id="calc-recycling" name="recyclingPercent"
                 min="0" max="100" step="5" value="${responses.recyclingPercent || 30}"
                 aria-valuemin="0" aria-valuemax="100" aria-valuenow="${responses.recyclingPercent || 30}" />
          <span id="recycling-display" style="min-width: 40px; font-weight: 600; color: var(--color-primary-400);">${responses.recyclingPercent || 30}%</span>
        </div>
      </div>

      <div class="calculator-preview" id="step-preview" aria-live="polite">
        <div class="calculator-preview-value" id="preview-value">—</div>
        <div class="calculator-preview-unit">estimated kg CO₂/year from shopping & waste</div>
      </div>
    </div>
  `;
}

function renderWizardActions() {
  return `
    <div class="wizard-actions">
      ${currentStep > 0
        ? '<button class="btn btn-secondary" id="wizard-prev" type="button">← Previous</button>'
        : '<span></span>'}
      ${currentStep < STEPS.length - 1
        ? '<button class="btn btn-primary" id="wizard-next" type="button">Next →</button>'
        : '<button class="btn btn-primary btn-lg pulse-glow" id="wizard-finish" type="button">Calculate My Footprint 🌿</button>'}
    </div>
  `;
}

function collectStepData() {
  const panel = document.getElementById('wizard-panel');
  if (!panel) { return; }

  const inputs = panel.querySelectorAll('input, select');
  inputs.forEach((input) => {
    if (!input.name) { return; }
    if (input.type === 'radio') {
      if (input.checked) {
        responses[input.name] = input.value;
      }
    } else if (input.type === 'number' || input.type === 'range') {
      responses[input.name] = sanitizeNumber(input.value, 0);
    } else {
      responses[input.name] = input.value;
    }
  });
}

function bindStepEvents() {
  // Range slider displays
  const renewable = document.getElementById('calc-renewable');
  const renewableDisplay = document.getElementById('renewable-display');
  if (renewable && renewableDisplay) {
    renewable.addEventListener('input', (e) => {
      renewableDisplay.textContent = `${e.target.value}%`;
      renewable.setAttribute('aria-valuenow', e.target.value);
      collectStepData();
      updatePreview();
    });
  }

  const recycling = document.getElementById('calc-recycling');
  const recyclingDisplay = document.getElementById('recycling-display');
  if (recycling && recyclingDisplay) {
    recycling.addEventListener('input', (e) => {
      recyclingDisplay.textContent = `${e.target.value}%`;
      recycling.setAttribute('aria-valuenow', e.target.value);
      collectStepData();
      updatePreview();
    });
  }

  // Diet radio buttons
  document.querySelectorAll('input[name="dietType"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('label.chip').forEach((label) => label.classList.remove('selected'));
      radio.closest('label')?.classList.add('selected');
      collectStepData();
      updatePreview();
    });
  });

  // Input change handlers for preview
  const panel = document.getElementById('wizard-panel');
  if (panel) {
    panel.querySelectorAll('input[type="number"], select').forEach((input) => {
      input.addEventListener('input', () => {
        collectStepData();
        updatePreview();
      });
    });
  }
}

function updatePreview() {
  collectStepData();
  const result = computeFootprint(responses);
  const step = STEPS[currentStep];
  const value = result.breakdown[step] || 0;

  const previewEl = document.getElementById('preview-value');
  if (previewEl) {
    previewEl.textContent = formatEmission(value);
  }
}

function bindNavigation() {
  document.getElementById('wizard-prev')?.addEventListener('click', () => {
    collectStepData();
    currentStep = Math.max(0, currentStep - 1);
    renderStepIndicator();
    renderCurrentStep();
  });

  document.getElementById('wizard-next')?.addEventListener('click', () => {
    collectStepData();
    currentStep = Math.min(STEPS.length - 1, currentStep + 1);
    renderStepIndicator();
    renderCurrentStep();
  });

  document.getElementById('wizard-finish')?.addEventListener('click', () => {
    collectStepData();
    const result = computeFootprint(responses);
    saveCalculatorResults({ ...result, responses });
    showToast({ title: 'Calculation Complete!', message: `Your annual footprint is ${formatEmission(result.totalKg)}.`, type: 'success' });
    renderResults(result);
  });
}

function renderResults(result) {
  const container = document.getElementById('page-container');
  if (!container) { return; }

  const breakdown = Object.entries(result.breakdown)
    .map(([cat, kg]) => ({ ...CATEGORIES[cat], kg }))
    .sort((a, b) => b.kg - a.kg);

  container.innerHTML = `
    <div class="animate-fade-up">
      <div class="results-hero" role="region" aria-label="Calculator results">
        <h1 class="page-title">Your Carbon Footprint</h1>
        <div class="results-total" aria-label="Total: ${formatEmission(result.totalKg)} per year">${formatEmission(result.totalKg)}</div>
        <p class="results-subtitle">estimated annual CO₂e emissions</p>
      </div>

      <div class="results-breakdown">
        ${breakdown.map((cat) => `
          <div class="breakdown-item animate-fade-up">
            <div class="breakdown-color" style="background: ${cat.color};"></div>
            <div class="breakdown-info">
              <div class="breakdown-category">${cat.icon} ${escapeHtml(cat.label)}</div>
              <div class="breakdown-value">${formatEmission(cat.kg)}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="wizard-actions" style="margin-top: var(--space-10); justify-content: center;">
        <button class="btn btn-secondary" id="recalculate-btn" type="button">Recalculate</button>
        <button class="btn btn-primary" id="view-insights-btn" type="button">View Insights 💡</button>
      </div>
    </div>
  `;

  document.getElementById('recalculate-btn')?.addEventListener('click', () => {
    currentStep = 0;
    responses = {};
    render(container);
  });

  document.getElementById('view-insights-btn')?.addEventListener('click', () => navigate('#/insights'));
}
