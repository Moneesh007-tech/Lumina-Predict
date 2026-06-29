import React, { useState, useEffect } from 'react';
import { X, Save, Plus, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductFormModalProps {
  product: Product | null; // If null, we are adding a new product
  onClose: () => void;
  onSave: (productData: Partial<Product>) => void;
}

export default function ProductFormModal({ product, onClose, onSave }: ProductFormModalProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Drinkware');
  const [currentStock, setCurrentStock] = useState(100);
  const [minStock, setMinStock] = useState(50);
  const [maxStock, setMaxStock] = useState(500);
  const [reorderPoint, setReorderPoint] = useState(100);
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [unitCost, setUnitCost] = useState(10.0);
  const [unitPrice, setUnitPrice] = useState(19.99);
  const [demandTrend, setDemandTrend] = useState<'rising' | 'stable' | 'falling'>('stable');
  const [seasonalityFactor, setSeasonalityFactor] = useState(1.0);
  const [error, setError] = useState('');

  // Categories presets
  const CATEGORIES = ['Drinkware', 'Footware', 'Office supplies', 'Wearable tech', 'Furniture'];

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setCategory(product.category);
      setCurrentStock(product.currentStock);
      setMinStock(product.minStock);
      setMaxStock(product.maxStock);
      setReorderPoint(product.reorderPoint);
      setLeadTimeDays(product.leadTimeDays);
      setUnitCost(product.unitCost);
      setUnitPrice(product.unitPrice);
      setDemandTrend(product.demandTrend);
      setSeasonalityFactor(product.seasonalityFactor);
    }
  }, [product]);

  // Handle leadTimeDays change or minStock change to suggest a reasonable reorder point automatically!
  // Reorder Point = (Average Daily Demand * Lead Time) + Safety Stock
  useEffect(() => {
    if (!product) {
      // Suggest a reorder point of safetyStock + a fraction of LeadTime * sales units
      const suggestedReorder = minStock + Math.round(leadTimeDays * 4);
      setReorderPoint(suggestedReorder);
    }
  }, [minStock, leadTimeDays]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Product name is required.');
    if (!sku.trim()) return setError('Product SKU code is required.');
    if (minStock >= maxStock) return setError('Safety Stock (Min) cannot exceed or equal Maximum storage capacity.');
    if (unitCost <= 0) return setError('Unit cost must be greater than $0.');
    if (unitPrice <= unitCost) return setError('Selling price must exceed unit cost to maintain profitability margins.');

    const payload: Partial<Product> = {
      name,
      sku: sku.toUpperCase().trim(),
      category,
      currentStock: Number(currentStock),
      minStock: Number(minStock),
      maxStock: Number(maxStock),
      reorderPoint: Number(reorderPoint),
      leadTimeDays: Number(leadTimeDays),
      unitCost: Number(unitCost),
      unitPrice: Number(unitPrice),
      demandTrend,
      seasonalityFactor: Number(seasonalityFactor)
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto font-sans">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <Plus className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              {product ? `Edit Product: ${product.name}` : 'Register New Inventory SKU'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-lg flex items-start space-x-2">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Product Title / Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Zenith Eco-Bottle (Water Flask)"
                value={name}
                onChange={e => setName(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                SKU Reference Code
              </label>
              <input
                type="text"
                required
                disabled={!!product}
                placeholder="e.g., SK-ZN-ECOBTL"
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/30 disabled:bg-slate-100 disabled:text-slate-400 font-mono tracking-wider uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Logistics Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Demand Trend Assessment
              </label>
              <select
                value={demandTrend}
                onChange={e => setDemandTrend(e.target.value as any)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                <option value="rising">Rising upward momentum</option>
                <option value="stable">Stable baseline demand</option>
                <option value="falling">Falling downward slide</option>
              </select>
            </div>
          </div>

          {/* Quantities & Buffers */}
          <div className="bg-slate-50/40 border border-slate-100 rounded-xl p-4 space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Stock Volume Parameters</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Current Stock Count
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={currentStock}
                  onChange={e => setCurrentStock(Math.max(0, Number(e.target.value)))}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Safety Stock Buffer (Min)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={minStock}
                  onChange={e => setMinStock(Math.max(0, Number(e.target.value)))}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Max Storage Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={maxStock}
                  onChange={e => setMaxStock(Math.max(1, Number(e.target.value)))}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          {/* Lead times & costs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Supplier Lead Time (Days)
              </label>
              <input
                type="number"
                min="1"
                required
                value={leadTimeDays}
                onChange={e => setLeadTimeDays(Math.max(1, Number(e.target.value)))}
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Suggested Reorder Point
              </label>
              <input
                type="number"
                min="1"
                required
                value={reorderPoint}
                onChange={e => setReorderPoint(Math.max(1, Number(e.target.value)))}
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/30"
                title="When stock falls below this level, reordering is advised"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Seasonality Index
                </label>
                <span className="text-[10px] font-bold text-emerald-600 font-mono">x{seasonalityFactor.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.0"
                step="0.05"
                value={seasonalityFactor}
                onChange={e => setSeasonalityFactor(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>

          {/* Unit Economics */}
          <div className="bg-slate-50/40 border border-slate-100 rounded-xl p-4 space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Unit Economics & Pricing</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Unit Cost Price ($)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={unitCost}
                  onChange={e => setUnitCost(Math.max(0.01, Number(e.target.value)))}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Unit Retail Selling Price ($)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={unitPrice}
                  onChange={e => setUnitPrice(Math.max(0.01, Number(e.target.value)))}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end space-x-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 hover:bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors shadow-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{product ? 'Save Changes' : 'Register SKU'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
