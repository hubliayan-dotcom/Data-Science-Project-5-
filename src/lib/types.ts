export interface SaleRow {
  storeId: string;
  itemId: string;
  category: string;
  date: string;
  qtySold: number;
  onPromo: boolean;
  discountPct: number;
  price: number;
  stockOnHand: number;
  stockoutFlag: boolean;
}

export interface InventoryRecommendation {
  storeId: string;
  itemId: string;
  onHand: number;
  safetyStock: number;
  reorderPoint: number;
  eoq: number;
  orderQty: number;
  reorderAlert: boolean;
}

export interface ForecastPoint {
  date: string;
  demand: number;
  actual?: number;
  isForecast: boolean;
}

export interface ModelMetrics {
  mae: number;
  mase: number;
  mape: number;
  stockoutReduction: number;
  overstockReduction: number;
  estimatedSavings: number;
}

export interface AnalysisResult {
  forecast: ForecastPoint[];
  inventory: InventoryRecommendation;
  metrics: ModelMetrics;
}
