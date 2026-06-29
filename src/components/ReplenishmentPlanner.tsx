import React, { useState } from 'react';
import { 
  ClipboardCheck, Clock, CheckCircle2, ChevronRight, Brain, 
  Sparkles, AlertTriangle, Send, Copy, FileText, ShoppingBag, PlusCircle 
} from 'lucide-react';
import { Product, ReplenishmentOrder } from '../types';

interface ReplenishmentPlannerProps {
  products: Product[];
  orders: ReplenishmentOrder[];
  onUpdateOrderStatus: (orderId: string, status: 'Draft' | 'Sent' | 'Shipped' | 'Received') => void;
  onInitiateOrder: (productId: string, quantity: number) => void;
}

export default function ReplenishmentPlanner({
  products,
  orders,
  onUpdateOrderStatus,
  onInitiateOrder
}: ReplenishmentPlannerProps) {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filter products that require immediate replenishment (under minStock)
  const atRiskProducts = products.filter(p => p.currentStock < p.minStock);

  // Trigger Gemini AI Report
  async function generateAiReport() {
    setLoadingReport(true);
    setAiReport(null);
    try {
      const token = localStorage.getItem('inventory_session_token');
      const response = await fetch('/api/ai/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }
      setAiReport(data.report);
    } catch (err: any) {
      console.error(err);
      setAiReport(`### ⚠️ System Advisory\n\nCould not compile the AI report: ${err.message}. Ensure your GEMINI_API_KEY is configured correctly in the Secrets panel.`);
    } finally {
      setLoadingReport(false);
    }
  }

  // Simple Markdown Parser for clean layout rendering without raw characters
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // H3
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-bold text-slate-900 font-display mt-5 mb-2 border-b border-slate-200 pb-1">{line.replace('### ', '')}</h4>;
      }
      // H2
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-base font-bold text-blue-800 font-display mt-6 mb-3">{line.replace('## ', '')}</h3>;
      }
      // Bold Markdown inline replacements
      let formattedLine: React.ReactNode = line;
      if (line.includes('**')) {
        const parts = line.split('**');
        formattedLine = parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-semibold text-slate-950">{part}</strong> : part);
      }

      // Bullets
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().substring(2);
        let bulletParts: React.ReactNode = content;
        if (content.includes('**')) {
          bulletParts = content.split('**').map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-semibold text-slate-950">{part}</strong> : part);
        }
        return (
          <li key={idx} className="text-xs text-slate-600 list-disc ml-5 mb-1.5 leading-relaxed">
            {bulletParts}
          </li>
        );
      }
      // Paragraph
      if (line.trim() === '') return <div key={idx} className="h-2"></div>;
      return <p key={idx} className="text-xs text-slate-600 leading-relaxed mb-2">{formattedLine}</p>;
    });
  };

  const copyToClipboard = () => {
    if (!aiReport) return;
    navigator.clipboard.writeText(aiReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: Low stock risks & Active orders (7 Cols) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Low Stock Replenishment Warnings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-slate-50 pb-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 font-display">Low-Stock Procurement Hazards</h3>
          </div>

          {atRiskProducts.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/20 text-slate-400">
              <CheckCircle2 className="h-10 w-10 mx-auto text-blue-600 mb-2" />
              <p className="text-xs font-semibold text-slate-700">All SKUs Stable & Healthy</p>
              <p className="text-[10px] text-slate-400 mt-0.5">No products are currently under safety margins.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {atRiskProducts.map(product => {
                const deficit = product.minStock - product.currentStock;
                const reorderRecommendation = Math.max(deficit, 50); // Minimum order suggested

                return (
                  <div key={product.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 border border-amber-100 bg-amber-50/30 rounded-xl">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 font-display">{product.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Current: <span className="font-semibold text-amber-700">{product.currentStock} Units</span> | Safety Threshold: <span className="font-semibold">{product.minStock} Units</span>
                      </p>
                    </div>

                    <div className="mt-3 sm:mt-0 flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 rounded px-2 py-0.5 font-mono">
                        Deficit: -{deficit}
                      </span>
                      <button
                        onClick={() => onInitiateOrder(product.id, reorderRecommendation)}
                        className="inline-flex items-center space-x-1 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-2.5 py-1.5 transition-colors"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Order {reorderRecommendation} Units</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Orders Tracker */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-slate-50 pb-3 mb-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 font-display">Active Warehouse Replenishments</h3>
          </div>

          {orders.length === 0 ? (
            <div className="p-8 text-center border border-slate-200 rounded-xl text-slate-400">
              <ShoppingBag className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700">No active orders</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Generate orders above or on product canvases.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 border-b border-slate-200 font-bold uppercase tracking-wider">
                    <th className="px-3 py-2">SKU / Item</th>
                    <th className="px-3 py-2 text-right">Quantity</th>
                    <th className="px-3 py-2 text-right">Cost</th>
                    <th className="px-3 py-2">ETA</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orders.map(order => {
                    let badgeColor = "bg-slate-100 text-slate-600";
                    if (order.status === "Sent") badgeColor = "bg-amber-50 text-amber-700 border border-amber-200";
                    if (order.status === "Shipped") badgeColor = "bg-blue-50 text-blue-700 border border-blue-200";
                    if (order.status === "Received") badgeColor = "bg-blue-50 text-blue-700 border border-blue-200";

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{order.productName}</span>
                            <span className="text-[10px] font-mono text-slate-400">{order.sku}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold font-mono">{order.quantity}</td>
                        <td className="px-3 py-3 text-right font-semibold font-mono">${order.totalCost.toFixed(2)}</td>
                        <td className="px-3 py-3 text-slate-500 font-mono">{order.estimatedArrival}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeColor}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          {order.status !== 'Received' ? (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'Received')}
                              className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded px-2 py-1 transition-all"
                              title="Mark as Received to credit warehouse stock"
                            >
                              Receive
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold">Logged</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: AI Supplier optimization Report (5 Cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col h-full min-h-[500px]">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 font-display">Lumina AI Optimizer</h3>
            </div>
            {aiReport && (
              <button
                onClick={copyToClipboard}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg px-2.5 py-1.5 transition-all flex items-center space-x-1"
                title="Copy markdown report to clipboard"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            )}
          </div>

          {!aiReport && !loadingReport ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-6 bg-slate-50/20 border-2 border-dashed border-slate-200 rounded-xl">
              <Brain className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700">Compile Live Procurement Analysis</p>
              <p className="text-xs text-slate-400 max-w-[280px] mt-1 mb-4">
                Consult Lumina AI to execute EOQ validations, estimate overstock holding costs, and draft vendor negotiation communications.
              </p>
              <button
                onClick={generateAiReport}
                className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate Executive Report</span>
              </button>
            </div>
          ) : loadingReport ? (
            <div className="flex-1 flex flex-col justify-center items-center py-12 text-center">
              <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider animate-pulse">Lumina analyzing stock statuses...</p>
              
              <div className="mt-6 space-y-1.5 max-w-[240px] text-[10px] text-slate-400 font-mono">
                <div className="flex items-center justify-start space-x-1">
                  <span className="text-blue-600">✓</span>
                  <span>Calculated current holding costs</span>
                </div>
                <div className="flex items-center justify-start space-x-1">
                  <span className="text-blue-600">✓</span>
                  <span>Extrapolated demand trendlines</span>
                </div>
                <div className="flex items-center justify-start space-x-1">
                  <span className="text-blue-600 animate-pulse">●</span>
                  <span>Formulating procurement templates...</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-[540px] pr-1.5 space-y-2 text-slate-700 scrollbar">
              {renderMarkdown(aiReport || '')}
              
              <div className="mt-6 pt-4 border-t border-slate-200 text-center">
                <button
                  onClick={generateAiReport}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Regenerate Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
