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
  isForecast: boolean;
}

export interface AnalysisResult {
  forecast: ForecastPoint[];
  inventory: InventoryRecommendation;
}
