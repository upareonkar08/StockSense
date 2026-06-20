import type { Holding, OptimizationResult, BacktestResult } from '../types';
import { dummyHoldings, dummyOptimization, dummyBacktestResult } from '../data/dummyData';

const getUserId = (): string => {
  const userJson = localStorage.getItem('stocksense_user');
  if (userJson) {
    try {
      const userObj = JSON.parse(userJson);
      return userObj.id || userObj.email || 'guest';
    } catch (e) {
      // ignore
    }
  }
  return 'guest';
};

const getStoredHoldings = (): Holding[] => {
  const userId = getUserId();
  const holdingsKey = `stocksense_holdings_${userId}`;
  const stored = localStorage.getItem(holdingsKey);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse stored holdings, resetting to default.", e);
    }
  }
  localStorage.setItem(holdingsKey, JSON.stringify(dummyHoldings));
  return [...dummyHoldings];
};

const saveStoredHoldings = (holdings: Holding[]): void => {
  const userId = getUserId();
  localStorage.setItem(`stocksense_holdings_${userId}`, JSON.stringify(holdings));
};

export const getPortfolio = async (): Promise<Holding[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return getStoredHoldings();
};

export const addHolding = async (h: Omit<Holding, 'id'>): Promise<Holding> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const holdings = getStoredHoldings();
  const newHolding = { ...h, id: `h_${Date.now()}` } as Holding;
  holdings.push(newHolding);
  saveStoredHoldings(holdings);
  return newHolding;
};

export const updateHolding = async (id: string, h: Partial<Holding>): Promise<Partial<Holding>> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const holdings = getStoredHoldings();
  const updated = holdings.map(item => item.id === id ? { ...item, ...h } as Holding : item);
  saveStoredHoldings(updated);
  return { ...h, id };
};

export const deleteHolding = async (id: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const holdings = getStoredHoldings();
  const filtered = holdings.filter(item => item.id !== id);
  saveStoredHoldings(filtered);
  return id;
};

export const getHealthScore = async (): Promise<{ score: number; risk: 'low' | 'medium' | 'high'; diversification: string }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return { score: 82, risk: 'medium', diversification: 'good' };
};

export const optimizePortfolio = async (): Promise<OptimizationResult> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return dummyOptimization;
};

export const runBacktest = async (_params: { startDate: string; endDate: string; benchmark: string }): Promise<BacktestResult> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return dummyBacktestResult;
};
