import { SaleRow, AnalysisResult, ForecastPoint, InventoryRecommendation } from './types.ts';
import { addDays, format, parseISO } from 'date-fns';

/**
 * Croston's Method for intermittent demand
 */
function crostonForecast(history: number[], horizon = 28): number {
  if (history.length === 0) return 0;
  
  const alpha = 0.1;
  let zHat = history.find(v => v > 0) || 0;
  let pHat = 1;
  
  let lastNonZero = -1;
  
  for (let i = 0; i < history.length; i++) {
    if (history[i] > 0) {
      zHat = alpha * history[i] + (1 - alpha) * zHat;
      if (lastNonZero !== -1) {
        const period = i - lastNonZero;
        pHat = alpha * period + (1 - alpha) * pHat;
      }
      lastNonZero = i;
    }
  }
  
  // SBA Bias correction
  return (zHat / pHat) * (1 - alpha / 2);
}

/**
 * Simple Seasonal Moving Average for regular demand
 */
function regularForecast(history: number[], horizon = 28): number {
  if (history.length < 28) return history.reduce((a, b) => a + b, 0) / (history.length || 1);
  
  // Weights: 0.5 for last 7 days, 0.3 for last 14, 0.2 for last 28
  const last7 = history.slice(-7).reduce((a, b) => a + b, 0) / 7;
  const last14 = history.slice(-14).reduce((a, b) => a + b, 0) / 14;
  const last28 = history.slice(-28).reduce((a, b) => a + b, 0) / 28;
  
  return (last7 * 0.5 + last14 * 0.3 + last28 * 0.2);
}

export function getForecastAndInventory(
  storeId: string, 
  itemId: string, 
  historyRows: SaleRow[], 
  horizon = 28,
  leadTime = 7
): AnalysisResult {
  const qtyHistory = historyRows.map(r => r.qtySold);
  const lastRow = historyRows[historyRows.length - 1];
  const lastDate = parseISO(lastRow.date);
  
  // Intermittency Check (P0)
  const zeroCount = qtyHistory.filter(v => v === 0).length;
  const p0 = zeroCount / (qtyHistory.length || 1);
  
  const dailyForecastValue = p0 >= 0.5 
    ? crostonForecast(qtyHistory) 
    : regularForecast(qtyHistory);
  
  const forecast: ForecastPoint[] = [];
  for (let i = 1; i <= horizon; i++) {
    forecast.push({
      date: format(addDays(lastDate, i), 'yyyy-MM-dd'),
      demand: Math.max(0, parseFloat(dailyForecastValue.toFixed(2))),
      isForecast: true
    });
  }
  
  // Inventory Stats
  const z = 1.645; // 95% service level
  const forecastSumLeadTime = dailyForecastValue * leadTime;
  
  // Residual uncertainty estimation
  const avg = qtyHistory.reduce((a, b) => a + b, 0) / (qtyHistory.length || 1);
  const variance = qtyHistory.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / (qtyHistory.length || 1);
  const stdDev = Math.sqrt(variance);
  
  const sigmaL = stdDev * Math.sqrt(leadTime);
  const safetyStock = Math.ceil(z * sigmaL);
  const reorderPoint = Math.ceil(forecastSumLeadTime + safetyStock);
  
  // EOQ: sqrt(2DK/H)
  const D = avg * 365; // Annual demand
  const K = 500; // Ordering cost
  const holdRate = 0.2;
  const unitCost = lastRow.price || 100;
  const H = unitCost * holdRate;
  const eoq = Math.ceil(Math.sqrt((2 * D * K) / (H || 1)));
  
  const onHand = lastRow.stockOnHand;
  const reorderAlert = onHand < reorderPoint;
  const orderQty = reorderAlert ? Math.max(eoq, reorderPoint - onHand) : 0;
  
  const inventory: InventoryRecommendation = {
    storeId,
    itemId,
    onHand,
    safetyStock,
    reorderPoint,
    eoq,
    orderQty: Math.ceil(orderQty),
    reorderAlert
  };
  
  return {
    forecast,
    inventory
  };
}
