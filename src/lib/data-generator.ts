import { SaleRow } from './types.ts';
import { addDays, format, isWeekend, startOfToday } from 'date-fns';

export function generateRetailData(nStores = 5, nSkus = 20): SaleRow[] {
  const rows: SaleRow[] = [];
  const stores = Array.from({ length: nStores }, (_, i) => `S${i + 1}`);
  const items = Array.from({ length: nSkus }, (_, i) => `ITEM_${(i + 1).toString().padStart(3, '0')}`);
  const categories = ['Groceries', 'Electronics', 'Apparel', 'Pharma', 'FMCG'];
  
  const startDate = addDays(startOfToday(), -730);
  
  stores.forEach(store => {
    items.forEach((item, itemIdx) => {
      const category = categories[itemIdx % 5];
      const baseDemand = Math.floor(Math.random() * 180) + 20;
      
      for (let i = 0; i < 730; i++) {
        const currentDate = addDays(startDate, i);
        const dayIdx = i;
        
        // Seasonality: annual sine wave
        const seasonMult = 1 + 0.3 * Math.sin((2 * Math.PI * dayIdx) / 365);
        
        // DOW: weekend boost
        const dowMult = isWeekend(currentDate) ? 1.3 : 1.0;
        
        // Holiday month boosts (Oct, Dec)
        const month = currentDate.getMonth() + 1; // 1-12
        const holidayMult = [10, 12].includes(month) ? 1.4 : 1.0;
        
        // Promo simulation
        const onPromo = Math.random() < 0.15;
        const discountPct = onPromo ? parseFloat((Math.random() * 0.2 + 0.1).toFixed(2)) : 0;
        const promoLift = onPromo ? 1 + 1.5 * discountPct : 1.0;
        
        // Random noise
        const noise = 1 + (Math.random() * 0.2 - 0.1);
        
        const demand = Math.max(0, Math.floor(baseDemand * seasonMult * dowMult * holidayMult * promoLift * noise));
        
        // Stockout simulation (5%)
        const isStockout = Math.random() < 0.05;
        const qtySold = isStockout ? 0 : demand;
        
        rows.push({
          storeId: store,
          itemId: item,
          category,
          date: format(currentDate, 'yyyy-MM-dd'),
          qtySold,
          onPromo,
          discountPct,
          price: parseFloat((Math.random() * 450 + 50).toFixed(2)),
          stockOnHand: Math.floor(Math.random() * 500),
          stockoutFlag: isStockout
        });
      }
    });
  });
  
  return rows;
}
