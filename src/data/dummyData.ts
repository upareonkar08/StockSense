import type { User, Holding, Recommendation, OptimizationResult, BacktestResult } from '../types';

export const dummyUser: User = {
  id: "u1",
  name: "Arjun Mehta",
  email: "arjun@example.com",
  riskTolerance: "moderate",
  investmentGoal: "Wealth Growth",
  investmentHorizon: "5+ Years"
};

export const dummyHoldings: Holding[] = [
  { id: "h1", symbol: "AAPL", companyName: "Apple Inc.", quantity: 50, buyPrice: 145, currentPrice: 182, purchaseDate: "2023-03-15" },
  { id: "h2", symbol: "MSFT", companyName: "Microsoft Corp.", quantity: 30, buyPrice: 290, currentPrice: 370, purchaseDate: "2023-01-10" },
  { id: "h3", symbol: "GOOGL", companyName: "Alphabet Inc.", quantity: 10, buyPrice: 2800, currentPrice: 3100, purchaseDate: "2022-11-20" },
  { id: "h4", symbol: "TSLA", companyName: "Tesla Inc.", quantity: 20, buyPrice: 200, currentPrice: 175, purchaseDate: "2023-06-05" },
  { id: "h5", symbol: "NVDA", companyName: "NVIDIA Corp.", quantity: 15, buyPrice: 400, currentPrice: 680, purchaseDate: "2023-02-28" }
];

export const portfolioGrowthData = [
  { month: "Jan", value: 95000 },
  { month: "Feb", value: 98000 },
  { month: "Mar", value: 102000 },
  { month: "Apr", value: 99000 },
  { month: "May", value: 110000 },
  { month: "Jun", value: 124350 }
];

export const benchmarkData = [
  { month: "Jan", portfolio: 95000, benchmark: 95000 },
  { month: "Feb", portfolio: 98000, benchmark: 96500 },
  { month: "Mar", portfolio: 102000, benchmark: 98000 },
  { month: "Apr", portfolio: 99000, benchmark: 97000 },
  { month: "May", portfolio: 110000, benchmark: 102000 },
  { month: "Jun", portfolio: 124350, benchmark: 108000 }
];

export const monthlyReturnsData = [
  { month: "Jan", return: 3.2 },
  { month: "Feb", return: 2.1 },
  { month: "Mar", return: -1.4 },
  { month: "Apr", return: 4.8 },
  { month: "May", return: -0.9 },
  { month: "Jun", return: 6.2 }
];

export const sectorData = [
  { sector: "Technology", percentage: 45 },
  { sector: "Healthcare", percentage: 18 },
  { sector: "Finance", percentage: 13 },
  { sector: "Consumer", percentage: 11 },
  { sector: "Energy", percentage: 8 },
  { sector: "Others", percentage: 5 }
];

export const dummyRecommendations: Recommendation[] = [
  { id: "r1", type: "rebalance", message: "Reduce AAPL from 35% → 25% to lower tech concentration", priority: "high" },
  { id: "r2", type: "buy", message: "Increase NVDA from 18% → 22% based on AI sector growth", priority: "medium" },
  { id: "r3", type: "buy", message: "Add 1-2 bond ETFs to improve portfolio stability", priority: "medium" },
  { id: "r4", type: "sell", message: "Consider trimming TSLA position — currently at a loss", priority: "low" }
];

export const dummyAIResponses: Record<string, string> = {
  "Why is my portfolio risky?": "Your portfolio has 45% exposure to the technology sector, which is significantly above the recommended 25-30% for a moderate risk investor. Additionally, TSLA contributes high volatility. I recommend diversifying into healthcare and bonds to bring your risk score down from Medium to Low.",
  "Should I sell TSLA now?": "TSLA is currently showing a -12.5% loss in your portfolio. Based on your 5+ year horizon, a short-term loss doesn't necessarily mean you should sell. However, if tech volatility concerns you, trimming 50% of your position and reallocating to a more stable stock could be wise.",
  "What is portfolio diversification?": "Diversification means spreading your investments across different asset classes, sectors, and geographies so that a loss in one area doesn't devastate your entire portfolio. Your current portfolio is 80% in tech stocks — a well-diversified portfolio typically spreads across 5-7 sectors.",
  "How do I reduce my risk score?": "To reduce your risk score from Medium to Low: 1) Reduce your tech sector weight from 45% to 25%, 2) Add 10-15% in bonds or bond ETFs, 3) Include dividend-paying stocks for stability, 4) Consider adding an index fund like SPY for broad market exposure.",
  "Explain Sharpe Ratio": "The Sharpe Ratio measures how much return you earn for each unit of risk. Your current Sharpe Ratio is 1.24, which is considered good (above 1.0). A ratio above 2.0 is excellent. It's calculated as: (Portfolio Return - Risk-Free Rate) / Portfolio Standard Deviation.",
  "What is a good P/E ratio?": "A P/E (Price-to-Earnings) ratio below 15 is generally considered undervalued, 15-25 is fair value, and above 25 may be overvalued. However, this varies by sector — tech companies often trade at higher P/E ratios due to growth expectations. Always compare within the same industry."
};

export const dummyOptimization: OptimizationResult = {
  currentAllocation: [
    { symbol: "AAPL", percentage: 35, value: 43522 },
    { symbol: "MSFT", percentage: 20, value: 24870 },
    { symbol: "GOOGL", percentage: 15, value: 18652 },
    { symbol: "TSLA", percentage: 12, value: 14922 },
    { symbol: "NVDA", percentage: 18, value: 22384 }
  ],
  recommendedAllocation: [
    { symbol: "AAPL", percentage: 25, change: -10 },
    { symbol: "MSFT", percentage: 25, change: 5 },
    { symbol: "GOOGL", percentage: 20, change: 5 },
    { symbol: "TSLA", percentage: 10, change: -2 },
    { symbol: "NVDA", percentage: 20, change: 2 }
  ],
  projectedReturnImprovement: 2.3,
  riskReduction: 8.1,
  currentSharpe: 0.84,
  recommendedSharpe: 1.12
};

export const dummyTestimonials = [
  { name: "Priya Sharma", role: "Retail Investor", avatar: "PS", text: "StockSense helped me identify that 60% of my portfolio was in one sector. After rebalancing, my risk score dropped significantly." },
  { name: "Rahul Gupta", role: "Software Engineer", avatar: "RG", text: "The AI Tutor explains complex concepts like Sharpe Ratio in plain language. I finally understand my own portfolio." },
  { name: "Neha Joshi", role: "Chartered Accountant", avatar: "NJ", text: "The backtesting feature showed me that my strategy would have outperformed the NIFTY 50 by 12% over 3 years." }
];

export const dummyBacktestResult: BacktestResult = {
  totalReturn: 48.3,
  cagr: 14.2,
  maxDrawdown: -18.4,
  sharpeRatio: 1.24,
  chartData: [
    { date: "2023-06", portfolio: 100000, benchmark: 100000 },
    { date: "2023-07", portfolio: 102500, benchmark: 101200 },
    { date: "2023-08", portfolio: 99800, benchmark: 98700 },
    { date: "2023-09", portfolio: 103400, benchmark: 100500 },
    { date: "2023-10", portfolio: 101200, benchmark: 99100 },
    { date: "2023-11", portfolio: 108500, benchmark: 104200 },
    { date: "2023-12", portfolio: 112300, benchmark: 107500 },
    { date: "2024-01", portfolio: 114800, benchmark: 109100 },
    { date: "2024-02", portfolio: 119500, benchmark: 112400 },
    { date: "2024-03", portfolio: 122100, benchmark: 114300 },
    { date: "2024-04", portfolio: 120500, benchmark: 112100 },
    { date: "2024-05", portfolio: 128400, benchmark: 117800 },
    { date: "2024-06", portfolio: 148300, benchmark: 136200 }
  ],
  monthlyReturns: [
    { month: "Jul 23", return: 2.5 },
    { month: "Aug 23", return: -2.6 },
    { month: "Sep 23", return: 3.6 },
    { month: "Oct 23", return: -2.1 },
    { month: "Nov 23", return: 7.2 },
    { month: "Dec 23", return: 3.5 },
    { month: "Jan 24", return: 2.2 },
    { month: "Feb 24", return: 4.1 },
    { month: "Mar 24", return: 2.2 },
    { month: "Apr 24", return: -1.3 },
    { month: "May 24", return: 6.6 },
    { month: "Jun 24", return: 15.5 }
  ]
};
