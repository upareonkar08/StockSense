export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentGoal: string;
  investmentHorizon: string;
}

export interface Holding {
  id: string;
  symbol: string;
  companyName: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  purchaseDate: string;
}

export interface Portfolio {
  id: string;
  userId: string;
  holdings: Holding[];
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  healthScore: number;
  riskScore: 'low' | 'medium' | 'high';
}

export interface BacktestResult {
  totalReturn: number;
  cagr: number;
  maxDrawdown: number;
  sharpeRatio: number;
  chartData: { date: string; portfolio: number; benchmark: number }[];
  monthlyReturns: { month: string; return: number }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface Recommendation {
  id: string;
  type: 'buy' | 'sell' | 'hold' | 'rebalance';
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface OptimizationResult {
  currentAllocation: { symbol: string; percentage: number; value: number }[];
  recommendedAllocation: { symbol: string; percentage: number; change: number }[];
  projectedReturnImprovement: number;
  riskReduction: number;
  currentSharpe: number;
  recommendedSharpe: number;
}
