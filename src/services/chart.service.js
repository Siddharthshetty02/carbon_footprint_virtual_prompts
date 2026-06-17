/**
 * @fileoverview Lightweight canvas chart rendering service.
 * No external dependencies — custom donut, bar, line, and gauge charts.
 * All charts include ARIA descriptions for accessibility.
 * @module ChartService
 */

/**
 * Resolves CSS custom properties to computed color values.
 * @param {string} varName - CSS variable name (e.g., '--text-primary').
 * @returns {string} Computed color value.
 */
function getCSSVar(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#94a3b8';
}

/**
 * Sets up a canvas for high-DPI rendering.
 * @param {HTMLCanvasElement} canvas - Canvas element.
 * @returns {CanvasRenderingContext2D} 2D context.
 */
function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return ctx;
}

/**
 * Renders a donut chart showing category breakdown.
 * @param {HTMLCanvasElement} canvas - Target canvas element.
 * @param {Array<{label: string, value: number, color: string}>} data - Chart data.
 * @param {Object} [options] - Chart options.
 * @param {string} [options.centerText] - Text to display in center.
 * @param {string} [options.centerSubtext] - Subtext below center text.
 */
export function renderDonutChart(canvas, data, options = {}) {
  if (!canvas || !data || data.length === 0) {
    return;
  }

  const ctx = setupCanvas(canvas);
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;
  const innerRadius = radius * 0.62;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (total === 0) {
    // Draw empty state ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, innerRadius, Math.PI * 2, 0, true);
    ctx.fillStyle = getCSSVar('--bg-surface') || 'rgba(255,255,255,0.04)';
    ctx.fill();

    ctx.font = `500 ${Math.max(12, radius * 0.15)}px Inter, sans-serif`;
    ctx.fillStyle = getCSSVar('--text-tertiary');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No data yet', centerX, centerY);
    return;
  }

  let startAngle = -Math.PI / 2;
  const gapAngle = 0.03;

  // Draw segments
  data.forEach((segment) => {
    if (segment.value <= 0) {
      return;
    }
    const sliceAngle = (segment.value / total) * Math.PI * 2 - gapAngle;
    if (sliceAngle <= 0) {
      return;
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = segment.color;
    ctx.fill();

    startAngle += sliceAngle + gapAngle;
  });

  // Center text
  if (options.centerText) {
    ctx.font = `800 ${Math.max(16, radius * 0.3)}px Inter, sans-serif`;
    ctx.fillStyle = getCSSVar('--text-primary');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(options.centerText, centerX, centerY - (options.centerSubtext ? 10 : 0));
  }

  if (options.centerSubtext) {
    ctx.font = `500 ${Math.max(10, radius * 0.12)}px Inter, sans-serif`;
    ctx.fillStyle = getCSSVar('--text-secondary');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(options.centerSubtext, centerX, centerY + Math.max(14, radius * 0.2));
  }

  // Set ARIA description
  const ariaText = data
    .filter((d) => d.value > 0)
    .map((d) => `${d.label}: ${d.value.toFixed(1)} kg (${((d.value / total) * 100).toFixed(0)}%)`)
    .join(', ');
  canvas.setAttribute('aria-label', `Carbon footprint breakdown chart. ${ariaText}`);
  canvas.setAttribute('role', 'img');
}

/**
 * Renders a line/area chart for emission trends.
 * @param {HTMLCanvasElement} canvas - Target canvas element.
 * @param {Array<{date: string, value: number}>} data - Trend data.
 * @param {Object} [options] - Chart options.
 * @param {string} [options.lineColor] - Line color.
 * @param {boolean} [options.showArea] - Whether to fill area under line.
 */
export function renderLineChart(canvas, data, options = {}) {
  if (!canvas || !data || data.length === 0) {
    return;
  }

  const ctx = setupCanvas(canvas);
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 1) * 1.15;
  const minValue = 0;

  const lineColor = options.lineColor || '#10b561';
  const textColor = getCSSVar('--text-tertiary');

  // Draw grid lines
  const gridLines = 4;
  ctx.strokeStyle = getCSSVar('--border-default') || 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartHeight / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    // Y-axis labels
    const val = maxValue - ((maxValue - minValue) / gridLines) * i;
    ctx.font = `400 11px Inter, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(val.toFixed(1), padding.left - 8, y);
  }
  ctx.setLineDash([]);

  // Calculate points
  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.value - minValue) / (maxValue - minValue)) * chartHeight,
  }));

  // Draw area fill
  if (options.showArea !== false) {
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, `${lineColor}33`);
    gradient.addColorStop(1, `${lineColor}03`);

    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding.bottom);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // Draw line
  ctx.beginPath();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  points.forEach((p, i) => {
    if (i === 0) {
      ctx.moveTo(p.x, p.y);
    } else {
      // Smooth curve using quadratic bezier
      const prev = points[i - 1];
      const cpx = (prev.x + p.x) / 2;
      ctx.quadraticCurveTo(prev.x + (cpx - prev.x) * 0.5, prev.y, cpx, (prev.y + p.y) / 2);
      ctx.quadraticCurveTo(p.x - (p.x - cpx) * 0.5, p.y, p.x, p.y);
    }
  });
  ctx.stroke();

  // Draw dots at data points (last 5 points only to avoid clutter)
  const visiblePoints = points.slice(-7);
  visiblePoints.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = getCSSVar('--bg-primary') || '#0a0f1c';
    ctx.fill();
  });

  // X-axis labels (show ~5 evenly spaced)
  const labelCount = Math.min(6, data.length);
  const step = Math.max(1, Math.floor(data.length / labelCount));
  ctx.font = `400 10px Inter, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let i = 0; i < data.length; i += step) {
    const dateStr = data[i].date;
    const shortDate = dateStr.slice(5); // MM-DD
    ctx.fillText(shortDate, points[i].x, height - padding.bottom + 8);
  }

  // ARIA description
  const avgValue = values.reduce((s, v) => s + v, 0) / values.length;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label',
    `Emission trend chart showing ${data.length} data points. Average: ${avgValue.toFixed(1)} kg CO₂ per day.`
  );
}

/**
 * Renders a horizontal bar chart for category comparison.
 * @param {HTMLCanvasElement} canvas - Target canvas element.
 * @param {Array<{label: string, value: number, color: string}>} data - Bar data.
 */
export function renderBarChart(canvas, data) {
  if (!canvas || !data || data.length === 0) {
    return;
  }

  const ctx = setupCanvas(canvas);
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const padding = { top: 10, right: 20, bottom: 10, left: 100 };
  const chartWidth = width - padding.left - padding.right;
  const barHeight = Math.min(30, (height - padding.top - padding.bottom) / data.length - 10);

  ctx.clearRect(0, 0, width, height);

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const textColor = getCSSVar('--text-secondary');

  data.forEach((item, i) => {
    const y = padding.top + i * (barHeight + 12);
    const barWidth = (item.value / maxValue) * chartWidth;

    // Label
    ctx.font = `500 12px Inter, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.label, padding.left - 12, y + barHeight / 2);

    // Bar background
    ctx.fillStyle = getCSSVar('--bg-surface') || 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(padding.left, y, chartWidth, barHeight, 4);
    ctx.fill();

    // Bar fill
    if (barWidth > 0) {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.roundRect(padding.left, y, Math.max(barWidth, 4), barHeight, 4);
      ctx.fill();
    }

    // Value label
    ctx.font = `600 11px Inter, sans-serif`;
    ctx.fillStyle = getCSSVar('--text-primary');
    ctx.textAlign = 'left';
    ctx.fillText(
      `${item.value.toFixed(1)} kg`,
      padding.left + barWidth + 8,
      y + barHeight / 2
    );
  });

  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label',
    `Bar chart. ${data.map((d) => `${d.label}: ${d.value.toFixed(1)} kg`).join(', ')}`
  );
}

/**
 * Creates an accessible chart legend as DOM elements.
 * @param {HTMLElement} container - Container for the legend.
 * @param {Array<{label: string, color: string, value?: number}>} items - Legend items.
 */
export function renderLegend(container, items) {
  if (!container) {
    return;
  }
  container.innerHTML = '';
  container.className = 'chart-legend';
  container.setAttribute('role', 'list');
  container.setAttribute('aria-label', 'Chart legend');

  items.forEach((item) => {
    const el = document.createElement('div');
    el.className = 'chart-legend-item';
    el.setAttribute('role', 'listitem');

    const colorDot = document.createElement('span');
    colorDot.className = 'chart-legend-color';
    colorDot.style.backgroundColor = item.color;
    colorDot.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.textContent = item.value !== undefined
      ? `${item.label} (${item.value.toFixed(1)} kg)`
      : item.label;

    el.appendChild(colorDot);
    el.appendChild(label);
    container.appendChild(el);
  });
}
