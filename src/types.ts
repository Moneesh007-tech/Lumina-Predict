/**
 * Types and interfaces for the Smart Inventory Demand Forecasting Dashboard.
 */

export interface SalesHistory {
  interval: string; // e.g., "Week -12", "Week -11", or months
  units: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number; // Safety stock
  maxStock: number; // Overstock threshold
  reorderPoint: number;
  leadTimeDays: number;
  unitCost: number;
  unitPrice: number;
  salesHistory: SalesHistory[];
  demandTrend: 'rising' | 'stable' | 'falling';
  seasonalityFactor: number; // multiplier, e.g., 1.2
}

export interface ForecastPoint {
  interval: string;
  units: number;
  lowerConfidence: number;
  upperConfidence: number;
  isForecast: boolean;
}

export interface ForecastResult {
  productId: string;
  algorithm: string;
  points: ForecastPoint[];
  confidenceScore: number; // 0 - 100
  accuracyMetric: string; // e.g., "MAPE: 8.4%"
  insights: string[];
}

export interface ReplenishmentOrder {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  totalCost: number;
  status: 'Draft' | 'Sent' | 'Shipped' | 'Received';
  createdAt: string;
  estimatedArrival: string;
}

export interface UserSession {
  userId: string;
  email: string;
  warehouseName: string;
  managerName: string;
}

export interface DashboardMetrics {
  totalItems: number;
  stockoutRisks: number;
  overstockedItems: number;
  totalInventoryValuation: number;
  pendingReplenishments: number;
}
