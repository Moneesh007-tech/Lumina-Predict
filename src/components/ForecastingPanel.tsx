import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ReferenceLine 
} from 'recharts';
import { 
  ArrowLeft, Brain, Cpu, Sliders, Calendar, Sparkles, 
  HelpCircle, ChevronRight, TrendingUp, AlertCircle 
} from 'lucide-react';
import { Product } from '../types';
import { 
  calculateSMA, calculateLinearRegression, 
  calculateExpSmoothingWithSeasonality, evaluateForecast 
} from '../utils/forecasting';

interface ForecastingPanelProps {
  product: Product;
  onBack: () => void;
  onInitiateReorder: (productId: string, qty: number) => void;
}

export default function ForecastingPanel({ product, onBack, onInitiateReorder }: ForecastingPanelProps) {
  const [algorithm, setAlgorithm] = useState<'SMA' | 'Linear' | 'SeasonalExp'>('SeasonalExp');
  const [forecastWeeks, setForecastWeeks] = useState<4 | 8>(4);
  const [alpha, setAlpha] = useState(0.4);
  const [beta, setBeta] = useState(0.2);
  const [whatIfMultiplier, setWhatIfMultiplier] = useState(100); // percentage

  // Run forecasting models
  const forecastPoints = useMemo(() => {
    let rawPoints = [];
    if (algorithm === 'SMA') {
      rawPoints = calculateSMA(product.salesHistory, 4, forecastWeeks);
    } else if (algorithm === 'Linear') {
      rawPoints = calculateLinearRegression(product.salesHistory, forecastWeeks);
    } else {
      rawPoints = calculateExpSmoothingWithSeasonality(product, forecastWeeks, alpha, beta);
    }

    // Apply what-if multiplier to forecast points (points with isForecast = true)
    return rawPoints.map(p => {
      if (p.isForecast) {
        const mult = whatIfMultiplier / 100;
        const adjustedUnits = Math.round(p.units * mult);
        const adjustedLower = Math.max(0, Math.round(p.lowerConfidence * mult));
        const adjustedUpper = Math.round(p.upperConfidence * mult);
        return {
          ...p,
          units: adjustedUnits,
          lowerConfidence: adjustedLower,
          upperConfidence: adjustedUpper,
        };
      }
      return p;
    });
  }, [product, algorithm, forecastWeeks, alpha, beta, whatIfMultiplier]);

  // Model evaluations
  const modelEval = useMemo(() => {
    const algoName = algorithm === 'SMA' ? 'Moving Average' : algorithm === 'Linear' ? 'Linear Regression' : 'Seasonal Exponential';
    return evaluateForecast(product, algoName);
  }, [product, algorithm]);

  // Calculate EOQ (Economic Order Quantity) approximation
  // EOQ = sqrt((2 * annualDemand * SetupCost) / HoldingCost)
  const eoq = useMemo(() => {
    const weeklyAvg = product.salesHistory.reduce((sum, h) => sum + h.units, 0) / Math.max(1, product.salesHistory.length);
    const annualDemand = weeklyAvg * 52;
    const orderCost = 150; // default order setup cost
    const holdingCost = Math.max(1, product.unitCost * 0.2); // holding cost 20% of unit cost
    const calculated = Math.round(Math.sqrt((2 * annualDemand * orderCost) / holdingCost));
    return Math.max(10, calculated);
  }, [product]);

  // Next week's projected demand
  const nextWeekProjected = useMemo(() => {
    const nextPt = forecastPoints.find(p => p.interval === 'Wk +1');
    return nextPt ? nextPt.units : 0;
  }, [forecastPoints]);

  return (
    <div className="space-y-6">
      {/* Back button and Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors text-slate-500"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-blue-600" />
              <span>Predictive Analytics Canvas</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 font-display mt-0.5">
              Demand Projection: {product.name}
            </h1>
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg px-2.5 py-1 font-mono">
            SKU: {product.sku}
          </span>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg px-2.5 py-1">
            Category: {product.category}
          </span>
        </div>
      </div>

      {/* Main forecast layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Time Series Graph (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">Time-Series Forecast Model</h3>
                <p className="text-xs text-slate-400">Shaded area represents a 95% statistical confidence margin</p>
              </div>
              
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setForecastWeeks(4)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${forecastWeeks === 4 ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  4 Wks
                </button>
                <button
                  onClick={() => setForecastWeeks(8)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${forecastWeeks === 8 ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  8 Wks
                </button>
              </div>
            </div>

            {/* Recharts Chart */}
            <div className="h-80 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={forecastPoints}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="interval" 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
                    labelClassName="font-display font-bold text-slate-900 text-xs"
                    itemStyle={{ fontSize: '11px', color: '#0f172a' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle" 
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
                  />

                  {/* Highlight Safety stock buffer limit */}
                  <ReferenceLine 
                    y={product.minStock} 
                    stroke="#f59e0b" 
                    strokeDasharray="4 4" 
                    label={{ value: 'Safety stock', fill: '#f59e0b', position: 'top', fontSize: 9, fontWeight: 600 }} 
                  />

                  {/* 95% Confidence Shaded Area */}
                  <Area
                    name="95% Confidence Band"
                    dataKey="upperConfidence"
                    range={['lowerConfidence', 'upperConfidence']}
                    fill="#3b82f6"
                    stroke="none"
                    fillOpacity={0.08}
                    connectNulls
                  />
                  {/* Fake area helper to bind lower range */}
                  <Area
                    legendType="none"
                    dataKey="lowerConfidence"
                    fill="none"
                    stroke="none"
                    connectNulls
                  />

                  {/* Historical Solid Line */}
                  <Line
                    name="Historical Sales"
                    type="monotone"
                    dataKey={d => d.isForecast ? null : d.units}
                    stroke="#475569"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#475569', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />

                  {/* Forecast Dash Line */}
                  <Line
                    name="Demand Forecast"
                    type="monotone"
                    dataKey={d => d.isForecast || d.interval === 'Week 0' ? d.units : null}
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Simulated Future Adjustments (What-If Slider) */}
            <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Simulate "What-If" Business Scenarios</span>
                </div>
                <span className="text-xs font-bold text-blue-700 font-mono mt-1 sm:mt-0 bg-blue-100 rounded-md px-2 py-0.5">
                  {whatIfMultiplier === 100 ? 'Normal Baseline' : `${whatIfMultiplier}% Demand Change`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Drag the slider to preview how demand patterns recalculate in reaction to marketing events, price discounts, or macro market shifts.
              </p>
              
              <div className="mt-4 flex items-center space-x-4">
                <span className="text-xs font-bold text-slate-400 font-mono">-50%</span>
                <input
                  type="range"
                  min="50"
                  max="180"
                  value={whatIfMultiplier}
                  onChange={e => setWhatIfMultiplier(Number(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-400 font-mono">+80%</span>
              </div>
            </div>
          </div>

          {/* Forecast Insights Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-blue-600" />
              <span>Model Observations & Recommendations</span>
            </h4>
            
            <ul className="space-y-3">
              {modelEval.insights.map((insight, idx) => (
                <li key={idx} className="flex items-start space-x-2.5 p-3 rounded-xl border border-slate-50 bg-slate-50/20 text-xs text-slate-700">
                  <AlertCircle className={`h-4.5 w-4.5 mt-0.5 shrink-0 ${insight.includes('Critical') || insight.includes('Excess') ? 'text-amber-500' : 'text-blue-600'}`} />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: Settings & Reorder (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Algorithmic Selection Control */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-4 border-b border-slate-50 pb-3">
              <Sliders className="h-4 w-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Algorithm Selection</h3>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setAlgorithm('SeasonalExp')}
                className={`w-full flex flex-col items-start p-3 rounded-xl border text-left transition-all ${algorithm === 'SeasonalExp' ? 'border-blue-500 bg-blue-50/20 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-bold text-slate-800 font-display">Seasonal Exponential</span>
                  {algorithm === 'SeasonalExp' && <span className="text-[9px] font-bold text-blue-700 bg-blue-100 rounded px-1.5 py-0.5">Active</span>}
                </div>
                <span className="text-[10px] text-slate-500 mt-1">Holt-Winters adjusted trend + season indexes. Highly accurate for cyclic products.</span>
              </button>

              <button
                onClick={() => setAlgorithm('Linear')}
                className={`w-full flex flex-col items-start p-3 rounded-xl border text-left transition-all ${algorithm === 'Linear' ? 'border-blue-500 bg-blue-50/20 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-bold text-slate-800 font-display">Linear Regression</span>
                  {algorithm === 'Linear' && <span className="text-[9px] font-bold text-blue-700 bg-blue-100 rounded px-1.5 py-0.5">Active</span>}
                </div>
                <span className="text-[10px] text-slate-500 mt-1">Estimates straight line trajectory. Best for persistent upward or downward movements.</span>
              </button>

              <button
                onClick={() => setAlgorithm('SMA')}
                className={`w-full flex flex-col items-start p-3 rounded-xl border text-left transition-all ${algorithm === 'SMA' ? 'border-blue-500 bg-blue-50/20 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-bold text-slate-800 font-display">Simple Moving Average</span>
                  {algorithm === 'SMA' && <span className="text-[9px] font-bold text-blue-700 bg-blue-100 rounded px-1.5 py-0.5">Active</span>}
                </div>
                <span className="text-[10px] text-slate-500 mt-1">Averages past 4 weeks. Ideal for stable demand with no prominent seasonal curves.</span>
              </button>
            </div>

            {algorithm === 'SeasonalExp' && (
              <div className="mt-4 pt-3 border-t border-slate-200 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Smooth Level Alpha (α)</span>
                    <span className="font-mono">{alpha}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={alpha}
                    onChange={e => setAlpha(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Smooth Trend Beta (β)</span>
                    <span className="font-mono">{beta}</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.5"
                    step="0.05"
                    value={beta}
                    onChange={e => setBeta(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Model Statistics Metrics */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Model Verification</h3>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Confidence Index</span>
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${modelEval.confidenceScore > 80 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                {modelEval.confidenceScore}% Acc
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Error Margin Metric</span>
              <span className="text-xs font-bold font-mono text-slate-700">{modelEval.accuracyMetric}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Economic Order (EOQ)</span>
              <span className="text-xs font-bold text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded" title="Economic Order Quantity maximizes holding vs ordering cost balance">
                {eoq} Units
              </span>
            </div>
          </div>

          {/* Actionable Reorder Card */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md space-y-4">
            <div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Immediate Procurement Action</span>
              <h4 className="text-sm font-bold font-display mt-0.5">Procurement Replenishment</h4>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Current Stock:</span>
                <span className="font-semibold text-white">{product.currentStock} Units</span>
              </div>
              <div className="flex justify-between">
                <span>Next Week Forecast:</span>
                <span className="font-semibold text-white">{nextWeekProjected} Units</span>
              </div>
              <div className="flex justify-between">
                <span>Optimal Replenish (EOQ):</span>
                <span className="font-semibold text-white">{eoq} Units</span>
              </div>
            </div>

            <button
              onClick={() => onInitiateReorder(product.id, eoq)}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-1"
            >
              <span>Authorize Order of {eoq} Units</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
