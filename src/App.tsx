import React, { useState, useEffect } from 'react';
import { 
  Warehouse, LogOut, TrendingUp, Cpu, Calendar, Sliders, Box, ShoppingBag, 
  Sparkles, CheckCircle2, MessageSquare, AlertCircle, X, HelpCircle, ShieldCheck 
} from 'lucide-react';
import { Product, UserSession, ReplenishmentOrder } from './types';
import LoginRegister from './components/LoginRegister';
import DashboardOverview from './components/DashboardOverview';
import ForecastingPanel from './components/ForecastingPanel';
import ReplenishmentPlanner from './components/ReplenishmentPlanner';
import GeminiCopilot from './components/GeminiCopilot';
import ProductFormModal from './components/ProductFormModal';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<ReplenishmentOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'replenish'>('dashboard');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Modals & Panels Toggles
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleProduct, setSaleProduct] = useState<Product | null>(null);
  
  // Inline States
  const [saleUnits, setSaleUnits] = useState(10);
  const [saleInterval, setSaleInterval] = useState('Week 1');
  
  // Loading & Diagnostics
  const [bootstrapping, setBootstrapping] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-restore login on load
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem('inventory_session_token');
      if (!token) {
        setBootstrapping(false);
        return;
      }
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const userData = await response.json();
          setSession(userData);
        } else {
          localStorage.removeItem('inventory_session_token');
        }
      } catch (e) {
        console.error("Session restore failed", e);
      } finally {
        setBootstrapping(false);
      }
    }
    restoreSession();
  }, []);

  // Sync inventory list and orders when logged in
  useEffect(() => {
    if (session) {
      fetchWarehouseData();
    }
  }, [session]);

  async function fetchWarehouseData() {
    setLoading(true);
    const token = localStorage.getItem('inventory_session_token');
    try {
      const [prodRes, ordRes] = await Promise.all([
        fetch('/api/inventory', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (prodRes.ok && ordRes.ok) {
        const prodData = await prodRes.json();
        const ordData = await ordRes.json();
        setProducts(prodData);
        setOrders(ordData);
      }
    } catch (e) {
      showToast('error', 'Network failure syncing warehouse levels.');
    } finally {
      setLoading(false);
    }
  }

  function showToast(type: 'success' | 'error', message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }

  // Auth Callbacks
  const handleLoginSuccess = (userSession: UserSession) => {
    setSession(userSession);
    showToast('success', `Logged in successfully as ${userSession.managerName}`);
  };

  const handleSignOut = () => {
    localStorage.removeItem('inventory_session_token');
    setSession(null);
    setProducts([]);
    setOrders([]);
    setSelectedProduct(null);
    setActiveTab('dashboard');
  };

  // Add/Edit Products
  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (prodData: Partial<Product>) => {
    const token = localStorage.getItem('inventory_session_token');
    const isEditing = !!editingProduct;
    const url = isEditing ? `/api/inventory/${editingProduct.id}` : '/api/inventory';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(prodData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit SKU parameters.');
      }

      showToast('success', isEditing ? `Product details for ${data.name} saved.` : `New SKU ${data.sku} registered.`);
      setIsProductModalOpen(false);
      setEditingProduct(null);
      fetchWarehouseData();
      
      // If we are currently viewing this product in forecast panel, update selection
      if (selectedProduct && selectedProduct.id === data.id) {
        setSelectedProduct(data);
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to completely deregister this SKU and delete all its sales forecast parameters? This action is irreversible.")) return;
    const token = localStorage.getItem('inventory_session_token');
    try {
      const res = await fetch(`/api/inventory/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showToast('success', 'SKU successfully removed from active catalog.');
        if (selectedProduct && selectedProduct.id === productId) {
          setSelectedProduct(null);
        }
        fetchWarehouseData();
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Deregister failed.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Log a Sale Callback
  const handleOpenSaleModal = (prod: Product) => {
    setSaleProduct(prod);
    setSaleUnits(Math.min(prod.currentStock, 15)); // Default suggest 10 or current max stock
    setSaleInterval('Week ' + (prod.salesHistory.length + 1));
    setIsSaleModalOpen(true);
  };

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleProduct) return;
    if (saleUnits > saleProduct.currentStock) {
      alert("Insufficient inventory stock remaining to satisfy this sales invoice!");
      return;
    }

    const token = localStorage.getItem('inventory_session_token');
    try {
      const res = await fetch(`/api/inventory/${saleProduct.id}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ units: saleUnits, interval: saleInterval })
      });

      if (res.ok) {
        showToast('success', `Recorded deduction of ${saleUnits} units for SKU ${saleProduct.sku}.`);
        setIsSaleModalOpen(false);
        setSaleProduct(null);
        fetchWarehouseData();
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Sales logging failed.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Reorder Callbacks
  const handleInitiateOrder = async (productId: string, quantity: number) => {
    const token = localStorage.getItem('inventory_session_token');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authorize order.');
      }

      showToast('success', `Replenishment order for ${quantity} units generated successfully.`);
      fetchWarehouseData();
      setActiveTab('replenish'); // Transition view to tracking
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'Draft' | 'Sent' | 'Shipped' | 'Received') => {
    const token = localStorage.getItem('inventory_session_token');
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        showToast('success', `Replenishment marked as ${status}. Stocks updated.`);
        fetchWarehouseData();
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Update status failed.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Loading indicator on boot
  if (bootstrapping) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-800 uppercase tracking-widest animate-pulse">Lumina Bootstrapping Security Context...</p>
        </div>
      </div>
    );
  }

  // Not Logged In
  if (!session) {
    return <LoginRegister onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* Dynamic Toast Notifications */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className={`p-4 rounded-xl border shadow-lg flex items-start space-x-3 max-w-sm ${notification.type === 'success' ? 'bg-white text-slate-800 border-blue-100' : 'bg-red-50 text-red-800 border-red-200'}`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold font-display uppercase tracking-wider">{notification.type === 'success' ? 'Synchronized' : 'Warning Advisory'}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Application Layout Shell */}
      <div className="flex-1 flex flex-col">
        {/* Navigation Top Header */}
        <header className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                <Warehouse className="h-5 w-5" />
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight font-display">Lumina <span className="text-blue-600 underline underline-offset-4 decoration-2">Predict</span></span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Tabs Nav for primary states (only when not inside product detail view) */}
              {!selectedProduct && (
                <nav className="flex space-x-1 bg-slate-100 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Box className="h-3.5 w-3.5" />
                    <span>Catalog Hub</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('replenish')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-semibold transition-all ${activeTab === 'replenish' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Procurement</span>
                  </button>
                </nav>
              )}

              {/* Consult Copilot Header link */}
              <button
                onClick={() => setIsCopilotOpen(!isCopilotOpen)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-all ${isCopilotOpen ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'}`}
                title="Toggle Lumina AI Copilot Assistant Drawer"
              >
                <Cpu className="h-4 w-4" />
                <span className="hidden sm:inline">Lumina AI</span>
              </button>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl transition-all"
                title="Deregister session secure client log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Workspace Main Panel Container */}
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {selectedProduct ? (
              <ForecastingPanel
                product={selectedProduct}
                onBack={() => setSelectedProduct(null)}
                onInitiateReorder={handleInitiateOrder}
              />
            ) : activeTab === 'dashboard' ? (
              <DashboardOverview
                products={products}
                session={session}
                onSelectProduct={setSelectedProduct}
                onAddProductClick={handleAddProduct}
                onEditProductClick={handleEditProduct}
                onDeleteProductClick={handleDeleteProduct}
                onLogSaleClick={handleOpenSaleModal}
              />
            ) : (
              <ReplenishmentPlanner
                products={products}
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onInitiateOrder={handleInitiateOrder}
              />
            )}
          </div>

          {/* Sidedrawer Gemini AI Chat Copilot */}
          {isCopilotOpen && (
            <div className="shrink-0 h-full hidden lg:block border-l border-slate-200 bg-white">
              <GeminiCopilot onClose={() => setIsCopilotOpen(false)} />
            </div>
          )}
        </main>
      </div>

      {/* Mobile Copilot Floating drawer (full overlay) */}
      {isCopilotOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex justify-end">
          <div className="absolute inset-0 bg-slate-900/25" onClick={() => setIsCopilotOpen(false)}></div>
          <div className="relative w-full max-w-sm h-full bg-white shadow-xl animate-slide-in">
            <GeminiCopilot onClose={() => setIsCopilotOpen(false)} />
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {isProductModalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setIsProductModalOpen(false)}
          onSave={handleSaveProduct}
        />
      )}

      {/* Log Sales Inline Popover Modal */}
      {isSaleModalOpen && saleProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 font-sans">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Real-Time Transactions</span>
                <h3 className="text-sm font-bold text-slate-900 font-display">Log Invoice Sale</h3>
              </div>
              <button
                onClick={() => setIsSaleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSale} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Product SKU Item</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col">
                  <span className="text-xs font-bold text-slate-800">{saleProduct.name}</span>
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5">{saleProduct.sku}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Interval Label</label>
                  <input
                    type="text"
                    required
                    value={saleInterval}
                    onChange={e => setSaleInterval(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-slate-50/20"
                    placeholder="e.g., Week 1"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-xs">
                    <label className="font-semibold text-slate-600 uppercase tracking-wider">Units Sold</label>
                    <span className="font-bold text-blue-600 font-mono">Max {saleProduct.currentStock}</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={saleProduct.currentStock}
                    required
                    value={saleUnits}
                    onChange={e => setSaleUnits(Math.min(saleProduct.currentStock, Math.max(1, Number(e.target.value))))}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                This transaction immediately deducts units from current stock, registers the interval on active charts, and triggers real-time safety thresholds warnings.
              </p>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaleModalOpen(false)}
                  className="px-3.5 py-1.5 hover:bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-1.5 px-4 rounded-lg text-xs transition-colors shadow-xs"
                >
                  Submit Sales Deduct
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
