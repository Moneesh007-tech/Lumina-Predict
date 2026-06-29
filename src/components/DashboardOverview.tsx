import React, { useState } from 'react';
import { 
  Search, Filter, Package, AlertCircle, ShieldAlert, BadgeCheck, 
  DollarSign, Truck, ClipboardList, Plus, Trash2, Edit2, TrendingUp, ArrowUpRight 
} from 'lucide-react';
import { Product, UserSession, DashboardMetrics } from '../types';

interface DashboardOverviewProps {
  products: Product[];
  session: UserSession;
  onSelectProduct: (product: Product) => void;
  onAddProductClick: () => void;
  onEditProductClick: (product: Product) => void;
  onDeleteProductClick: (productId: string) => void;
  onLogSaleClick: (product: Product) => void;
}

export default function DashboardOverview({
  products,
  session,
  onSelectProduct,
  onAddProductClick,
  onEditProductClick,
  onDeleteProductClick,
  onLogSaleClick
}: DashboardOverviewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 15;

  // Calculate Metrics
  const totalValuation = products.reduce((sum, p) => sum + p.currentStock * p.unitCost, 0);
  const stockoutCount = products.filter(p => p.currentStock < p.minStock).length;
  const overstockCount = products.filter(p => p.currentStock > p.maxStock).length;
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // Filters logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'stockout') {
      matchesStatus = p.currentStock < p.minStock;
    } else if (statusFilter === 'overstock') {
      matchesStatus = p.currentStock > p.maxStock;
    } else if (statusFilter === 'stable') {
      matchesStatus = p.currentStock >= p.minStock && p.currentStock <= p.maxStock;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * PAGE_SIZE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm">
        <div>
          <div className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Fulfillment Dashboard
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-display mt-1">
            {session.warehouseName}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Welcome back, <span className="font-semibold text-slate-700">{session.managerName}</span>. Lumina predictive intelligence and ML models are online.
          </p>
        </div>
        <button
          onClick={onAddProductClick}
          className="mt-4 md:mt-0 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Register New SKU</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inventory Valuation</span>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 font-display">
              ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-slate-400 text-xs flex items-center mt-1">
              Active warehouse stock value
            </span>
          </div>
        </div>

        {/* Stockout Hazards */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Stockout Risk SKUs</span>
            <div className={`p-2 rounded-lg ${stockoutCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-bold font-display ${stockoutCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {stockoutCount} Items
            </h3>
            <span className="text-slate-400 text-xs flex items-center mt-1">
              {stockoutCount > 0 ? 'Below safety stock margins' : 'Safe buffer levels maintained'}
            </span>
          </div>
        </div>

        {/* Overstocked Units */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overstock Capital Risk</span>
            <div className={`p-2 rounded-lg ${overstockCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-bold font-display ${overstockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {overstockCount} Items
            </h3>
            <span className="text-slate-400 text-xs flex items-center mt-1">
              {overstockCount > 0 ? 'Bound up capital' : 'No surplus storage overhead'}
            </span>
          </div>
        </div>

        {/* Total SKU coverage */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monitored Catalog</span>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 font-display">
              {products.length} Products
            </h3>
            <span className="text-slate-400 text-xs flex items-center mt-1">
              Managed SKU records in hub
            </span>
          </div>
        </div>
      </div>

      {/* Catalog Filters and List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter Toolbar Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 font-display">
              Inventory Catalog Manager
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative rounded-lg shadow-xs min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search Name or SKU..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Category select */}
            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <Filter className="h-3 w-3 text-slate-400 mr-1" />
              <span className="text-slate-400 mr-1">Cat:</span>
              <select
                value={categoryFilter}
                onChange={e => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent focus:outline-hidden font-medium"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status select */}
            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <AlertCircle className="h-3 w-3 text-slate-400 mr-1" />
              <span className="text-slate-400 mr-1">Risk:</span>
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent focus:outline-hidden font-medium"
              >
                <option value="All">All Stocks</option>
                <option value="stockout">Stockout Risks</option>
                <option value="overstock">Overstocks</option>
                <option value="stable">Optimal Levels</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Table Container */}
        <div className="overflow-x-auto">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-600">No catalog matching the filters</p>
              <p className="text-xs text-slate-400 mt-1">Clear your keywords or register a new SKU to begin forecasting.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th scope="col" className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Product Info & SKU</th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Stock Level</th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Stock Status</th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Buffer / Max Limits</th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Unit Cost (Margin)</th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {paginatedProducts.map(product => {
                  const isStockout = product.currentStock < product.minStock;
                  const isOverstock = product.currentStock > product.maxStock;
                  
                  // Progress bar calculations
                  const percentage = Math.min(100, Math.max(2, (product.currentStock / product.maxStock) * 100));
                  let barColor = "bg-blue-600";
                  if (isStockout) barColor = "bg-amber-500 animate-pulse";
                  if (isOverstock) barColor = "bg-red-500";
 
                  // Margin calculations
                  const profitMargin = ((product.unitPrice - product.unitCost) / product.unitPrice) * 100;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors duration-100">
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900 font-display">{product.name}</span>
                          <span className="text-[10px] font-mono font-medium text-slate-400 mt-0.5 tracking-wider">{product.sku}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-600 bg-slate-100">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex flex-col w-36">
                          <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                            <span>{product.currentStock} Units</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className={`${barColor} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {isStockout ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200">
                            <AlertCircle className="h-3 w-3" />
                            <span>STOCKOUT RISK</span>
                          </span>
                        ) : isOverstock ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-red-700 bg-red-50 border border-red-200">
                            <AlertCircle className="h-3 w-3" />
                            <span>OVERSTOCKED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200">
                            <BadgeCheck className="h-3 w-3" />
                            <span>OPTIMAL</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-slate-500 font-mono">
                        <span className="font-semibold text-slate-700">{product.minStock}</span> / <span className="font-semibold text-slate-700">{product.maxStock}</span>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-semibold text-slate-900">${product.unitCost.toFixed(2)}</span>
                          <span className="text-[10px] text-blue-600 font-semibold mt-0.5">+{profitMargin.toFixed(0)}% Margin</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-right text-xs font-semibold">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onSelectProduct(product)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors"
                            title="Forecast future demand patterns"
                          >
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>Forecast</span>
                          </button>
                          
                          <button
                            onClick={() => onLogSaleClick(product)}
                            className="px-2 py-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Record live sales deduction"
                          >
                            <span>Log Sale</span>
                          </button>

                          <button
                            onClick={() => onEditProductClick(product)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit properties"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteProductClick(product.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete SKU"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {filteredProducts.length > 0 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
              <div>
                Showing <span className="font-semibold text-slate-700">{startIndex + 1}</span> to{' '}
                <span className="font-semibold text-slate-700">
                  {Math.min(startIndex + PAGE_SIZE, totalItems)}
                </span>{' '}
                of <span className="font-semibold text-slate-700">{totalItems}</span> products
              </div>
              <div className="flex items-center space-x-1">
                <button
                  disabled={activePage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent font-semibold transition-colors bg-white cursor-pointer"
                >
                  Previous
                </button>
                <div className="flex items-center px-3 font-medium text-slate-600">
                  Page {activePage} of {totalPages}
                </div>
                <button
                  disabled={activePage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent font-semibold transition-colors bg-white cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
