# CarbonWise — Carbon Footprint Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Vitest-green.svg)](#testing)

> **Understand, track, and reduce your carbon footprint through personalized insights and simple daily actions.**

CarbonWise is a privacy-first web application that empowers individuals to measure, monitor, and minimize their environmental impact. All data stays on-device using localStorage — no server, no tracking, no account required.

---

## ✨ Features

### 📊 Interactive Dashboard
- Real-time emission statistics (daily, weekly, monthly)
- Category breakdown donut chart
- 30-day emission trend line chart
- Global/national comparison gauge
- Logging streak tracker

### 🧮 Carbon Calculator
- Multi-step wizard (Transport → Energy → Food → Lifestyle)
- Real-time calculation preview
- EPA/DEFRA emission factor database
- Personalized annual footprint estimate

### 📝 Activity Logger
- Quick-add form with category and type selection
- Date-based activity logging with validation
- Category filtering and search
- CSV export for data portability
- Edit and delete with confirmation dialogs

### 💡 Personalized Insights
- AI-like recommendation engine
- Tips ranked by relevance to your emission pattern
- Impact ratings (High/Medium/Low)
- Potential savings estimates
- Category-specific deep dives

### 🎯 Reduction Goals
- Set custom reduction targets (5%–50%)
- Progress tracking with milestone markers
- Time elapsed vs. goal progress comparison
- Baseline vs. current emission tracking

### 🏅 Achievements
- 12 unlockable badges
- Progress tracking per achievement
- Motivational milestones

---

## 🏗️ Architecture

```
carbonwise/
├── index.html                    # Semantic HTML5 entry point with CSP
├── package.json                  # Dependencies and scripts
├── vite.config.js               # Vite build configuration
├── vitest.config.js             # Test configuration
├── eslint.config.js             # Code quality rules
├── src/
│   ├── main.js                  # App bootstrap
│   ├── router.js                # Hash-based SPA router
│   ├── components/
│   │   ├── navbar.js            # Responsive navigation
│   │   ├── toast.js             # Toast notifications
│   │   └── modal.js             # Focus-trapped modal dialog
│   ├── pages/
│   │   ├── dashboard.js         # Overview with charts
│   │   ├── calculator.js        # Multi-step carbon calculator
│   │   ├── activities.js        # Activity CRUD + export
│   │   ├── insights.js          # Tips, achievements, facts
│   │   └── goals.js             # Reduction goal management
│   ├── services/
│   │   ├── carbon.service.js    # Emission calculations & CRUD
│   │   ├── chart.service.js     # Custom canvas chart engine
│   │   ├── insights.service.js  # Recommendation engine
│   │   ├── storage.service.js   # Secure localStorage wrapper
│   │   └── validation.service.js # Input validation
│   ├── utils/
│   │   ├── constants.js         # Emission factors & config
│   │   ├── helpers.js           # Pure utility functions
│   │   └── sanitize.js          # XSS prevention
│   └── styles/
│       ├── variables.css        # Design system tokens
│       ├── reset.css            # Modern CSS reset
│       ├── accessibility.css    # WCAG utilities
│       ├── layout.css           # Grid & flex system
│       ├── components.css       # Component styles
│       └── pages.css            # Page-specific styles
└── tests/
    ├── setup.js                 # Test environment setup
    ├── services/
    │   ├── carbon.service.test.js
    │   ├── storage.service.test.js
    │   ├── insights.service.test.js
    │   └── validation.service.test.js
    └── utils/
        ├── helpers.test.js
        └── sanitize.test.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm 9+

### Installation
```bash
git clone <repository-url>
cd carbonwise
npm install
```

### Development
```bash
npm run dev        # Start dev server on http://localhost:3000
```

### Production Build
```bash
npm run build      # Build to dist/
npm run preview    # Preview production build
```

---

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report (target: >80%)
```

### Test Coverage
- **Services**: Carbon calculations, storage, insights, validation
- **Utilities**: Helpers, sanitization
- **Edge Cases**: XSS prevention, invalid inputs, boundary values

---

## ♿ Accessibility

CarbonWise is built to WCAG 2.1 AA standards:

- **Skip Navigation**: Skip-to-content link for keyboard users
- **ARIA Landmarks**: Proper `role` attributes on all sections
- **Keyboard Navigation**: Full keyboard accessibility throughout
- **Focus Management**: Focus trapping in modals, visible focus indicators
- **Screen Reader Support**: ARIA labels, live regions, chart descriptions
- **Color Contrast**: 4.5:1+ contrast ratios
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **High Contrast**: Enhanced borders in high-contrast mode
- **Touch Targets**: Minimum 44×44px interactive elements

---

## 🔒 Security

- **Content Security Policy**: CSP meta tag restricting script sources
- **Input Sanitization**: All user inputs sanitized before DOM insertion
- **XSS Prevention**: HTML entity escaping, script tag removal
- **No `eval()`**: ESLint enforces no-eval, no-implied-eval, no-new-func
- **URL Validation**: Only http/https protocols allowed
- **Storage Safety**: Namespaced keys, size limits, quota handling
- **No External Runtime Dependencies**: Zero third-party JavaScript in production

---

## 📊 Data Sources

Emission factors are based on:
- **EPA** GHG Emission Factors Hub (2024)
- **DEFRA** UK Government GHG Conversion Factors (2024)
- **Poore & Nemecek (2018)**, Science — Food emission data
- **IEA** World Energy Outlook — Energy grid mix
- **World Bank** / Global Carbon Project — Per capita averages

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](./LICENSE).
