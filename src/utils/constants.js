/**
 * @fileoverview Emission factors and application constants.
 * Based on EPA (US) and DEFRA (UK) emission factor databases.
 * All emission values are in kg CO₂e (carbon dioxide equivalent).
 * @module constants
 */

/** @typedef {'transport'|'energy'|'food'|'shopping'|'waste'} CategoryId */

/**
 * Category definitions with metadata for display and calculations.
 * @type {Record<CategoryId, {id: string, label: string, icon: string, color: string, description: string}>}
 */
export const CATEGORIES = Object.freeze({
  transport: {
    id: 'transport',
    label: 'Transport',
    icon: '🚗',
    color: '#3b82f6',
    description: 'Car, bus, train, flights, and cycling',
  },
  energy: {
    id: 'energy',
    label: 'Energy',
    icon: '⚡',
    color: '#f59e0b',
    description: 'Electricity, heating, and cooling',
  },
  food: {
    id: 'food',
    label: 'Food',
    icon: '🍽️',
    color: '#10b561',
    description: 'Diet, meals, and food waste',
  },
  shopping: {
    id: 'shopping',
    label: 'Shopping',
    icon: '🛍️',
    color: '#8b5cf6',
    description: 'Clothing, electronics, and goods',
  },
  waste: {
    id: 'waste',
    label: 'Waste',
    icon: '♻️',
    color: '#ec4899',
    description: 'Recycling, composting, and landfill',
  },
});

/**
 * Transport emission factors in kg CO₂e per unit.
 * Sources: EPA GHG Emission Factors Hub (2024), DEFRA 2024.
 */
export const TRANSPORT_FACTORS = Object.freeze({
  car_gasoline: { factor: 0.21, unit: 'km', label: 'Car (Gasoline)' },
  car_diesel: { factor: 0.17, unit: 'km', label: 'Car (Diesel)' },
  car_hybrid: { factor: 0.11, unit: 'km', label: 'Car (Hybrid)' },
  car_electric: { factor: 0.05, unit: 'km', label: 'Car (Electric)' },
  bus: { factor: 0.089, unit: 'km', label: 'Bus' },
  train: { factor: 0.041, unit: 'km', label: 'Train' },
  subway: { factor: 0.033, unit: 'km', label: 'Subway/Metro' },
  bicycle: { factor: 0.0, unit: 'km', label: 'Bicycle' },
  walking: { factor: 0.0, unit: 'km', label: 'Walking' },
  motorcycle: { factor: 0.113, unit: 'km', label: 'Motorcycle' },
  flight_short: { factor: 0.255, unit: 'km', label: 'Flight (Short <1500km)' },
  flight_medium: { factor: 0.156, unit: 'km', label: 'Flight (Medium)' },
  flight_long: { factor: 0.15, unit: 'km', label: 'Flight (Long >4000km)' },
});

/**
 * Energy emission factors in kg CO₂e per unit.
 * Based on average US/EU electricity grid mix.
 */
export const ENERGY_FACTORS = Object.freeze({
  electricity: { factor: 0.42, unit: 'kWh', label: 'Electricity' },
  natural_gas: { factor: 2.0, unit: 'm³', label: 'Natural Gas' },
  heating_oil: { factor: 2.52, unit: 'liter', label: 'Heating Oil' },
  solar: { factor: 0.0, unit: 'kWh', label: 'Solar Power' },
  wind: { factor: 0.0, unit: 'kWh', label: 'Wind Power' },
});

/**
 * Food emission factors in kg CO₂e per serving/meal.
 * Based on Poore & Nemecek (2018), Science.
 */
export const FOOD_FACTORS = Object.freeze({
  meat_beef: { factor: 7.2, unit: 'meal', label: 'Beef Meal' },
  meat_lamb: { factor: 5.8, unit: 'meal', label: 'Lamb Meal' },
  meat_pork: { factor: 2.4, unit: 'meal', label: 'Pork Meal' },
  meat_chicken: { factor: 1.8, unit: 'meal', label: 'Chicken Meal' },
  fish: { factor: 1.6, unit: 'meal', label: 'Fish Meal' },
  vegetarian: { factor: 0.7, unit: 'meal', label: 'Vegetarian Meal' },
  vegan: { factor: 0.4, unit: 'meal', label: 'Vegan Meal' },
  dairy: { factor: 1.2, unit: 'serving', label: 'Dairy Products' },
  food_waste: { factor: 0.25, unit: 'kg', label: 'Food Waste' },
});

/**
 * Shopping emission factors in kg CO₂e per item.
 */
export const SHOPPING_FACTORS = Object.freeze({
  clothing_new: { factor: 15.0, unit: 'item', label: 'New Clothing' },
  clothing_secondhand: { factor: 1.0, unit: 'item', label: 'Secondhand Clothing' },
  electronics_phone: { factor: 70.0, unit: 'item', label: 'Smartphone' },
  electronics_laptop: { factor: 300.0, unit: 'item', label: 'Laptop' },
  furniture: { factor: 50.0, unit: 'item', label: 'Furniture (average)' },
  books: { factor: 1.1, unit: 'item', label: 'Book' },
  online_order: { factor: 1.5, unit: 'order', label: 'Online Order (shipping)' },
});

/**
 * Waste emission factors in kg CO₂e per kg.
 */
export const WASTE_FACTORS = Object.freeze({
  landfill: { factor: 0.58, unit: 'kg', label: 'Landfill Waste' },
  recycling: { factor: 0.02, unit: 'kg', label: 'Recycled Waste' },
  composting: { factor: 0.01, unit: 'kg', label: 'Composted Waste' },
  incineration: { factor: 0.41, unit: 'kg', label: 'Incinerated Waste' },
});

/**
 * Global and national average annual CO₂ emissions per capita (tonnes).
 * Source: World Bank, Global Carbon Project 2024.
 */
export const AVERAGES = Object.freeze({
  global: 4.7,
  us: 14.7,
  eu: 6.2,
  uk: 5.2,
  india: 2.0,
  china: 8.0,
});

/**
 * Achievement badge definitions.
 * @type {Array<{id: string, name: string, icon: string, description: string, condition: string, threshold: number}>}
 */
export const ACHIEVEMENTS = Object.freeze([
  { id: 'first_log', name: 'First Step', icon: '🌱', description: 'Log your first activity', condition: 'activities_count', threshold: 1 },
  { id: 'week_streak', name: 'Week Warrior', icon: '🔥', description: '7-day logging streak', condition: 'streak_days', threshold: 7 },
  { id: 'month_streak', name: 'Monthly Master', icon: '🏆', description: '30-day logging streak', condition: 'streak_days', threshold: 30 },
  { id: 'calculator_done', name: 'Self-Aware', icon: '🔍', description: 'Complete the footprint calculator', condition: 'calculator_completed', threshold: 1 },
  { id: 'below_average', name: 'Below Average', icon: '📉', description: 'Monthly footprint below global average', condition: 'monthly_below_average', threshold: 1 },
  { id: 'goal_setter', name: 'Goal Setter', icon: '🎯', description: 'Set your first reduction goal', condition: 'goals_count', threshold: 1 },
  { id: 'green_commuter', name: 'Green Commuter', icon: '🚲', description: 'Log 10 zero-emission commutes', condition: 'green_commutes', threshold: 10 },
  { id: 'plant_powered', name: 'Plant Powered', icon: '🥗', description: 'Log 20 vegetarian/vegan meals', condition: 'plant_meals', threshold: 20 },
  { id: 'recycler', name: 'Recycling Hero', icon: '♻️', description: 'Log 15 recycling activities', condition: 'recycling_count', threshold: 15 },
  { id: 'half_target', name: 'Halfway There', icon: '⭐', description: 'Reach 50% of a reduction goal', condition: 'goal_50_percent', threshold: 1 },
  { id: 'goal_complete', name: 'Mission Complete', icon: '🏅', description: 'Fully achieve a reduction goal', condition: 'goal_100_percent', threshold: 1 },
  { id: 'data_lover', name: 'Data Lover', icon: '📊', description: 'Log 50 activities total', condition: 'activities_count', threshold: 50 },
]);

/**
 * Educational facts about carbon emissions.
 * @type {Array<{text: string, source: string}>}
 */
export const FACTS = Object.freeze([
  { text: 'If every household in the US replaced one beef meal per week with a plant-based option, it would be equivalent to taking 7.6 million cars off the road.', source: 'Environmental Research Letters' },
  { text: 'A single transatlantic return flight generates roughly 1.6 tonnes of CO₂ — nearly a third of the average annual emissions for someone in the EU.', source: 'Carbon Brief' },
  { text: 'LED bulbs use at least 75% less energy than incandescent bulbs and last 25 times longer, preventing significant CO₂ emissions.', source: 'US Department of Energy' },
  { text: 'The fashion industry produces 10% of annual global carbon emissions — more than all international flights and maritime shipping combined.', source: 'UNEP' },
  { text: 'One mature tree absorbs approximately 22 kg of CO₂ per year. A hectare of forest can absorb up to 10 tonnes annually.', source: 'European Environment Agency' },
  { text: 'Cycling instead of driving for short trips (under 5 km) can reduce your transport emissions by up to 75%.', source: 'European Cyclists Federation' },
  { text: 'Food waste in landfills generates methane — a greenhouse gas 25 times more potent than CO₂ over 100 years.', source: 'IPCC' },
  { text: 'Washing clothes at 30°C instead of 40°C can reduce energy use by 40% per load.', source: 'Energy Saving Trust' },
  { text: 'Renewable energy sources now generate over 30% of global electricity, up from 19% in 2010.', source: 'IEA World Energy Outlook 2024' },
  { text: 'Composting food scraps instead of landfilling them reduces methane emissions by up to 95%.', source: 'US EPA' },
]);

/**
 * Reduction tips organized by category with estimated savings.
 * @type {Array<{id: string, category: CategoryId, title: string, description: string, savingsKg: number, impact: 'high'|'medium'|'low'}>}
 */
export const REDUCTION_TIPS = Object.freeze([
  { id: 'tip_1', category: 'transport', title: 'Switch to Public Transit', description: 'Taking the bus or train instead of driving alone can cut your commuting emissions by 50-70%.', savingsKg: 1200, impact: 'high' },
  { id: 'tip_2', category: 'transport', title: 'Work from Home', description: 'Working from home even 2 days per week eliminates roughly 40% of your commuting emissions.', savingsKg: 800, impact: 'high' },
  { id: 'tip_3', category: 'transport', title: 'Combine Errands', description: 'Planning trips to combine multiple errands reduces total driving distance by 20-30%.', savingsKg: 300, impact: 'medium' },
  { id: 'tip_4', category: 'energy', title: 'Switch to LED Lighting', description: 'Replacing all bulbs with LEDs saves about 40 kg CO₂ per year per household.', savingsKg: 40, impact: 'low' },
  { id: 'tip_5', category: 'energy', title: 'Lower Thermostat 2°C', description: 'Reducing heating temperature by 2°C can save up to 10% on energy bills and 300 kg CO₂.', savingsKg: 300, impact: 'medium' },
  { id: 'tip_6', category: 'energy', title: 'Switch to Green Energy', description: 'Choosing a renewable energy provider can reduce household electricity emissions to near zero.', savingsKg: 1500, impact: 'high' },
  { id: 'tip_7', category: 'food', title: 'Reduce Beef Consumption', description: 'Replacing beef with chicken or plant-based protein once a week saves about 300 kg CO₂ per year.', savingsKg: 300, impact: 'high' },
  { id: 'tip_8', category: 'food', title: 'Eat More Plant-Based Meals', description: 'Going vegetarian 3 days a week can reduce food emissions by 20%.', savingsKg: 500, impact: 'high' },
  { id: 'tip_9', category: 'food', title: 'Reduce Food Waste', description: 'Planning meals and storing food properly can cut food waste by 50%, saving 100+ kg CO₂.', savingsKg: 130, impact: 'medium' },
  { id: 'tip_10', category: 'shopping', title: 'Buy Secondhand', description: 'Buying secondhand clothing saves about 14 kg CO₂ per garment compared to new.', savingsKg: 200, impact: 'medium' },
  { id: 'tip_11', category: 'shopping', title: 'Extend Device Lifespan', description: 'Keeping your phone an extra year saves 70+ kg of embodied carbon emissions.', savingsKg: 70, impact: 'low' },
  { id: 'tip_12', category: 'waste', title: 'Start Composting', description: 'Composting kitchen waste instead of landfilling cuts organic waste emissions by 95%.', savingsKg: 150, impact: 'medium' },
  { id: 'tip_13', category: 'waste', title: 'Maximize Recycling', description: 'Properly recycling paper, plastic, and metal can save 100+ kg CO₂ per year.', savingsKg: 100, impact: 'medium' },
  { id: 'tip_14', category: 'transport', title: 'Cycle Short Distances', description: 'Biking trips under 5 km instead of driving eliminates those trips\' emissions entirely.', savingsKg: 400, impact: 'medium' },
  { id: 'tip_15', category: 'energy', title: 'Unplug Standby Devices', description: 'Standby power (phantom load) can account for 5-10% of household electricity usage.', savingsKg: 50, impact: 'low' },
]);

/**
 * Storage keys for localStorage.
 * @enum {string}
 */
export const STORAGE_KEYS = Object.freeze({
  ACTIVITIES: 'cw_activities',
  CALCULATOR_RESULTS: 'cw_calculator_results',
  GOALS: 'cw_goals',
  PREFERENCES: 'cw_preferences',
  ACHIEVEMENTS: 'cw_achievements',
  SCHEMA_VERSION: 'cw_schema_version',
});

/** Current data schema version for migration support. */
export const CURRENT_SCHEMA_VERSION = 1;

/** Maximum activities stored to prevent storage overflow. */
export const MAX_ACTIVITIES = 5000;

/** Maximum storage size in bytes (4.5 MB — leaving headroom under 5MB limit). */
export const MAX_STORAGE_BYTES = 4_500_000;
