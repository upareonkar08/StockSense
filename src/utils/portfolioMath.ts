import type { Holding } from '../types';

export const TICKER_SECTORS: Record<string, string> = {
  AAPL: 'Technology',
  MSFT: 'Technology',
  GOOGL: 'Technology',
  NVDA: 'Technology',
  META: 'Technology',
  TSLA: 'Consumer',
  AMZN: 'Consumer',
  NFLX: 'Communication',
  JPM: 'Finance',
  BAC: 'Finance',
  JNJ: 'Healthcare',
  UNH: 'Healthcare',
  XOM: 'Energy',
  CVX: 'Energy',
};

export const getSectorData = (holdings: Holding[]) => {
  const sectorValues: Record<string, number> = {};
  let totalValue = 0;
  
  holdings.forEach(h => {
    const sym = h.symbol.toUpperCase();
    const sector = TICKER_SECTORS[sym] || 'Others';
    const value = h.quantity * h.currentPrice;
    sectorValues[sector] = (sectorValues[sector] || 0) + value;
    totalValue += value;
  });
  
  if (totalValue === 0) return [];
  
  return Object.entries(sectorValues).map(([sector, value]) => ({
    sector,
    percentage: Math.round((value / totalValue) * 100)
  })).sort((a, b) => b.percentage - a.percentage);
};

export const getDynamicHealthScore = (holdings: Holding[]) => {
  if (holdings.length === 0) return 0;
  
  let totalValue = 0;
  const values: number[] = [];
  const sectorValues: Record<string, number> = {};
  
  holdings.forEach(h => {
    const val = h.quantity * h.currentPrice;
    values.push(val);
    totalValue += val;
    
    const sector = TICKER_SECTORS[h.symbol.toUpperCase()] || 'Others';
    sectorValues[sector] = (sectorValues[sector] || 0) + val;
  });
  
  if (totalValue === 0) return 0;
  
  // 1. Concentration penalty (HHI)
  // Higher concentration = lower score
  const hhi = values.reduce((sum, val) => sum + (val / totalValue) ** 2, 0);
  const hhiScore = Math.max(0, 100 * (1 - hhi));
  
  // 2. Sector concentration penalty
  const maxSectorWeight = Math.max(...Object.values(sectorValues)) / totalValue;
  const sectorScore = Math.max(0, 100 * (1 - maxSectorWeight));
  
  // 3. Performance metric: count of assets
  const sizeScore = Math.min(100, holdings.length * 20); // 5+ assets = 100
  
  const composite = 0.4 * hhiScore + 0.4 * sectorScore + 0.2 * sizeScore;
  return Math.max(10, Math.min(100, Math.round(composite)));
};
