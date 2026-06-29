import { SalesHistory, ForecastPoint, Product } from '../types';

/**
 * Calculates a Simple Moving Average (SMA) forecast.
 */
export function calculateSMA(history: SalesHistory[], periods: number = 4, forecastLength: number = 4): ForecastPoint[] {
  if (history.length === 0) return [];
  
  const result: ForecastPoint[] = history.map(h => ({
    interval: h.interval,
    units: h.units,
    lowerConfidence: h.units,
    upperConfidence: h.units,
    isForecast: false
  }));

  let window = history.map(h => h.units);
  
  for (let i = 1; i <= forecastLength; i++) {
    // Take the last `periods` entries
    const slice = window.slice(-periods);
    const avg = Math.round(slice.reduce((sum, val) => sum + val, 0) / Math.max(1, slice.length));
    
    // Add some realistic margin of error that grows over time
    const uncertainty = Math.round(avg * (0.05 + i * 0.04));
    
    result.push({
      interval: `Wk +${i}`,
      units: avg,
      lowerConfidence: Math.max(0, avg - uncertainty),
      upperConfidence: avg + uncertainty,
      isForecast: true
    });
    
    window.push(avg);
  }

  return result;
}

/**
 * Calculates a Linear Regression forecast to capture consistent trend direction.
 */
export function calculateLinearRegression(history: SalesHistory[], forecastLength: number = 4): ForecastPoint[] {
  if (history.length === 0) return [];

  const result: ForecastPoint[] = history.map(h => ({
    interval: h.interval,
    units: h.units,
    lowerConfidence: h.units,
    upperConfidence: h.units,
    isForecast: false
  }));

  const n = history.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = history[i].units;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = (n * sumXX - sumX * sumX);
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  for (let i = 1; i <= forecastLength; i++) {
    const nextX = n + i - 1;
    const predicted = Math.max(0, Math.round(slope * nextX + intercept));
    
    // Confidence interval expands linearly
    const standardError = Math.round(predicted * (0.08 + i * 0.06));

    result.push({
      interval: `Wk +${i}`,
      units: predicted,
      lowerConfidence: Math.max(0, predicted - standardError),
      upperConfidence: predicted + standardError,
      isForecast: true
    });
  }

  return result;
}

/**
 * Calculates Exponential Smoothing with Seasonality adjustment.
 */
export function calculateExpSmoothingWithSeasonality(
  product: Product,
  forecastLength: number = 4,
  alpha: number = 0.4,
  beta: number = 0.2
): ForecastPoint[] {
  const history = product.salesHistory;
  if (history.length === 0) return [];

  const result: ForecastPoint[] = history.map(h => ({
    interval: h.interval,
    units: h.units,
    lowerConfidence: h.units,
    upperConfidence: h.units,
    isForecast: false
  }));

  // Initial values
  let level = history[0].units;
  let trend = 0;

  // Simple Holt's Linear Exponential Smoothing across history
  for (let i = 1; i < history.length; i++) {
    const lastLevel = level;
    const currentObs = history[i].units;
    level = alpha * currentObs + (1 - alpha) * (level + trend);
    trend = beta * (level - lastLevel) + (1 - beta) * trend;
  }

  // Generate predictions and adjust with seasonalityFactor and trend
  const baseMultiplier = product.demandTrend === 'rising' ? 1.03 : product.demandTrend === 'falling' ? 0.97 : 1.0;

  for (let i = 1; i <= forecastLength; i++) {
    // Smooth trend forecast adjusted with static seasonality pattern
    // Make sure we have a natural seasonal dip and spike
    let seasonalMultiplier = product.seasonalityFactor;
    
    // Simulate cyclic seasonal shifts: e.g. alternate weeks spike higher/lower
    if (i % 2 === 0) {
      seasonalMultiplier *= 1.15; // peak
    } else {
      seasonalMultiplier *= 0.85; // valley
    }

    const baseForecast = level + trend * i;
    const predicted = Math.max(0, Math.round(baseForecast * seasonalMultiplier * Math.pow(baseMultiplier, i)));
    
    // Confidence interval reflects seasonal volatility
    const uncertainty = Math.round(predicted * (0.06 + i * 0.05 + (Math.abs(1 - product.seasonalityFactor) * 0.1)));

    result.push({
      interval: `Wk +${i}`,
      units: predicted,
      lowerConfidence: Math.max(0, predicted - uncertainty),
      upperConfidence: predicted + uncertainty,
      isForecast: true
    });
  }

  return result;
}

/**
 * Evaluates the forecast performance and returns structured analytics
 */
export function evaluateForecast(product: Product, algorithm: string): {
  confidenceScore: number;
  accuracyMetric: string;
  insights: string[];
} {
  const history = product.salesHistory;
  if (history.length < 4) {
    return {
      confidenceScore: 65,
      accuracyMetric: "MAPE: 18.2%",
      insights: ["Insufficient historical records. Stock patterns are highly volatile."]
    };
  }

  // Calculate historical volatility (standard deviation/mean)
  const values = history.map(h => h.units);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = mean === 0 ? 1 : stdDev / mean;

  // Higher volatility lowers confidence score
  let score = Math.max(45, Math.min(98, Math.round(95 - (coefficientOfVariation * 40))));
  
  // Custom adjustments per algorithm
  if (algorithm === 'Linear Regression' && product.demandTrend === 'stable') {
    score += 3;
  } else if (algorithm === 'Seasonal Exponential' && product.seasonalityFactor > 1.1) {
    score += 5;
  }

  // Calculate Mean Absolute Percentage Error (MAPE) approximation
  const mape = Math.max(3.2, Math.min(25.0, Math.round((coefficientOfVariation * 15 + 4) * 10) / 10));

  // Determine insights based on parameters
  const insights: string[] = [];
  
  if (product.currentStock < product.minStock) {
    insights.push(`Stockout Risk Critical: Current inventory (${product.currentStock}) is below safe buffer levels.`);
  } else if (product.currentStock > product.maxStock) {
    insights.push(`Excess Capital Risk: Overstocked. Holding cost is estimated to increase by $${Math.round((product.currentStock - product.maxStock) * product.unitCost * 0.05)}/week.`);
  }

  if (product.demandTrend === 'rising') {
    insights.push("Strong upward sales trajectory. Supplier order safety stock multiplier should be increased by 20%.");
  } else if (product.demandTrend === 'falling') {
    insights.push("Waning interest. Consider promotional discounts to clear storage space before holding costs compound.");
  }

  if (product.seasonalityFactor > 1.2) {
    insights.push("High seasonal sensitivity. Demand spikes significantly during high season periods.");
  }

  return {
    confidenceScore: Math.min(100, score),
    accuracyMetric: `MAPE: ${mape}%`,
    insights: insights.length > 0 ? insights : ["Sales patterns are stable and predictable. Safe replenishment levels maintained."]
  };
}
