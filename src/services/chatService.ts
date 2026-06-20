import type { Holding } from '../types';
import { formatCurrency } from '../utils/formatters';

const STOCK_PRICES: Record<string, number> = {
  AAPL: 182.50,
  MSFT: 370.00,
  TSLA: 175.20,
  GOOGL: 145.80,
  NVDA: 680.00,
  AMZN: 178.40,
  JPM: 175.50,
  JNJ: 160.20,
  XOM: 115.80,
  PG: 158.40,
};

const STOCK_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corp.',
  TSLA: 'Tesla Inc.',
  GOOGL: 'Alphabet Inc.',
  NVDA: 'NVIDIA Corp.',
  AMZN: 'Amazon.com Inc.',
  JPM: 'JPMorgan Chase & Co.',
  JNJ: 'Johnson & Johnson',
  XOM: 'Exxon Mobil Corp.',
  PG: 'Procter & Gamble Co.',
};

const STOCK_SECTORS: Record<string, string> = {
  AAPL: 'Technology',
  MSFT: 'Technology',
  TSLA: 'Consumer',
  GOOGL: 'Technology',
  NVDA: 'Technology',
  AMZN: 'Consumer',
  JPM: 'Finance',
  JNJ: 'Healthcare',
  XOM: 'Energy',
  PG: 'Consumer',
};

const STOCK_DESCRIPTIONS: Record<string, string> = {
  AAPL: 'Apple is a consumer technology giant with highly sticky hardware ecosystems (iPhone, Mac) and high-margin services revenue.',
  MSFT: 'Microsoft is an enterprise SaaS and cloud infrastructure behemoth, positioned as a key leader in generative AI integrations.',
  TSLA: 'Tesla is a pioneer in electric vehicles and battery energy systems, trading at a high growth multiple with elevated volatility.',
  GOOGL: 'Alphabet (Google) dominates global search, advertising, and video streaming (YouTube), with heavy investments in AI (Gemini).',
  NVDA: 'NVIDIA manufactures high-performance GPUs that power global data centers, AI models, and deep learning computations.',
  AMZN: 'Amazon is the global leader in e-commerce and cloud infrastructure (AWS), exhibiting high cash flows and massive logistics scale.',
  JPM: 'JPMorgan is the largest US bank, offering stable dividend income, strong commercial credit operations, and financial sector leadership.',
  JNJ: 'Johnson & Johnson is a diversified healthcare and pharmaceutical giant, featuring a historically stable business model and AAA credit rating.',
  XOM: 'Exxon Mobil is an oil and natural gas supermajor, generating significant free cash flows and providing a strong inflation hedge.',
  PG: 'Procter & Gamble is a consumer staples giant (Tide, Gillette) with exceptional pricing power and over 65 years of dividend increases.',
};

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

export const sendMessage = async (message: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  const query = message.trim().toLowerCase();
  const userId = getUserId();

  // Helper: Retrieve dynamic portfolio state from localStorage
  let holdings: Holding[] = [];
  try {
    const storedHoldings = localStorage.getItem(`stocksense_holdings_${userId}`);
    if (storedHoldings) {
      holdings = JSON.parse(storedHoldings);
    }
  } catch (e) {
    console.error("Failed to read holdings in Analyst Chat:", e);
  }

  let cash = 100000;
  try {
    const storedCash = localStorage.getItem(`stocksense_cash_${userId}`);
    if (storedCash) {
      cash = Number(storedCash);
    }
  } catch (e) {
    console.error("Failed to read cash in Analyst Chat:", e);
  }

  // Portfolio Math
  const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
  const totalInvestedCost = holdings.reduce((sum, h) => sum + h.quantity * h.buyPrice, 0);
  const totalNetWorth = totalHoldingsValue + cash;
  const totalPnL = totalHoldingsValue - totalInvestedCost;
  const overallPnLPct = totalInvestedCost > 0 ? (totalPnL / totalInvestedCost) * 100 : 0;

  // Max concentration factor
  const maxConcentration = holdings.length > 0
    ? Math.max(...holdings.map(h => (h.quantity * h.currentPrice) / (totalHoldingsValue || 1)))
    : 0;

  // Approximate Sharpe Ratio
  const currentSharpeVal = holdings.length === 0 
    ? "0.0" 
    : ((0.6 + (holdings.length * 0.08) - (maxConcentration * 0.3)).toFixed(2));

  // 1. GREETINGS & INTROS
  if (query.match(/^(hello|hi|hey|greetings|good morning|good afternoon|howdy|yo)/)) {
    return `Hello! I am your StockSense Portfolio Analyst.\n\nI am connected to your active portfolio holdings and market feeds. You can ask me questions about your holdings (e.g., 'What is my portfolio value?', 'How is my Apple stock doing?'), rebalancing recommendations, or general financial concepts (e.g., 'Explain Sharpe Ratio', 'What is HHI?').\n\nHow can I assist you with your investment analysis today?`;
  }

  // 2. PORTFOLIO NET WORTH & VALUE QUERIES
  if (query.includes('portfolio') || query.includes('value') || query.includes('net worth') || query.includes('balance') || query.includes('cash') || query.includes('holdings') || query.includes('how much money')) {
    if (holdings.length === 0) {
      return `Your dynamic paper trading cash balance is **${formatCurrency(cash)}**, but you do not currently hold any stock positions.\n\nI recommend visiting the **Suggestions** or **Live Trading** tabs to add high-conviction assets and start tracking your performance!`;
    }
    
    return `Here is a live summary of your StockSense Portfolio:\n\n• **Total Portfolio Net Worth**: ${formatCurrency(totalNetWorth)}\n• **Active Holdings Value**: ${formatCurrency(totalHoldingsValue)}\n• **Available Cash Balance**: ${formatCurrency(cash)}\n• **Total Invested Capital**: ${formatCurrency(totalInvestedCost)}\n• **Overall Holdings P&L**: ${formatCurrency(totalPnL)} (${overallPnLPct >= 0 ? '+' : ''}${overallPnLPct.toFixed(2)}%)\n\nYour portfolio is fully loaded! Let me know if you would like me to explain how HHI concentration affects these numbers.`;
  }

  // 3. SPECIFIC TICKERS DETECTOR
  const tickers = Object.keys(STOCK_PRICES);
  for (const ticker of tickers) {
    if (query.includes(ticker.toLowerCase()) || query.includes(STOCK_NAMES[ticker].toLowerCase().split(' ')[0])) {
      const holding = holdings.find(h => h.symbol === ticker);
      
      if (holding) {
        const holdingVal = holding.quantity * holding.currentPrice;
        const holdingCost = holding.quantity * holding.buyPrice;
        const holdingPnL = holdingVal - holdingCost;
        const holdingPnLPct = holdingCost > 0 ? (holdingPnL / holdingCost) * 100 : 0;
        const weight = totalHoldingsValue > 0 ? (holdingVal / totalHoldingsValue) * 100 : 0;
        
        return `You currently hold **${holding.quantity} shares** of **${holding.companyName} (${holding.symbol})**:\n\n• **Average Buy Price**: ${formatCurrency(holding.buyPrice)}\n• **Current Market Price**: ${formatCurrency(holding.currentPrice)}\n• **Current Market Value**: ${formatCurrency(holdingVal)}\n• **Unrealized Position P&L**: ${formatCurrency(holdingPnL)} (${holdingPnL >= 0 ? '+' : ''}${holdingPnLPct.toFixed(2)}%)\n• **Portfolio Weight**: ${weight.toFixed(1)}%\n\n*Analyst Note*: This asset falls under the **${STOCK_SECTORS[ticker]}** sector. ${STOCK_DESCRIPTIONS[ticker]}\n\nLet me know if you would like to run a rebalancing calculation for this asset in the **Optimizer** tab!`;
      } else {
        return `You do not currently hold any shares of **${STOCK_NAMES[ticker]} (${ticker})** in your portfolio.\n\nHowever, its current market quote is **${formatCurrency(STOCK_PRICES[ticker])}**. It belongs to the **${STOCK_SECTORS[ticker]}** sector.\n\n• *Analyst Insight*: ${STOCK_DESCRIPTIONS[ticker]}\n\nWould you like to visit the **Paper Trading Terminal** to execute a mock trade for ${ticker}?`;
      }
    }
  }

  // 4. FINANCIAL CONCEPTS DICTIONARY
  if (query.includes('sharpe')) {
    return `The **Sharpe Ratio** measures the risk-adjusted return of an investment portfolio.\n\nIt is calculated as:\n\n\`Sharpe = (Portfolio Return - Risk-Free Rate) / Volatility\`\n\n• **What it means**: It evaluates if your excess returns are due to smart asset allocation or taking on excessive risk. Higher is better.\n• **Benchmarks**: Above 1.0 is considered good, above 2.0 is very good, and above 3.0 is excellent.\n• **Your Portfolio**: Your estimated portfolio Sharpe ratio is **${currentSharpeVal}**. You can improve this by optimizing weights in the **Optimizer** tab.`;
  }

  if (query.includes('hhi') || query.includes('concentration') || query.includes('diversif')) {
    return `The **Herfindahl-Hirschman Index (HHI)** is a metric used to evaluate asset concentration risk.\n\nIt is calculated by squaring the weights of all individual holdings in your portfolio:\n\n\`HHI = sum(weight^2)\`\n\n• **Low concentration (HHI < 0.15)**: Highly diversified. Risk is spread out across many stocks.\n• **High concentration (HHI > 0.25)**: Concentrated. High risk, as a drop in one stock heavily impacts your net worth.\n\nYou can view your dynamic HHI rating and sector exposure breakdown on the **Portfolio Health** page.`;
  }

  if (query.includes('var') || query.includes('value at risk')) {
    return `**Value at Risk (VaR)** estimates the maximum potential loss your portfolio could experience over a set period with a specific probability.\n\nFor example, a **95% daily VaR of -2.5%** means that there is a 5% chance (or roughly 1 trading day per month) that your portfolio will lose more than 2.5% of its value in a single day.\n\nIt is a crucial metric used by institutional risk managers to prepare for worst-case drawdowns.`;
  }

  if (query.includes('beta')) {
    return `**Beta** measures how sensitive your portfolio is to market fluctuations (usually benchmarked against the S&P 500 or NIFTY 50).\n\n• **Beta = 1.0**: Moves in sync with the market.\n• **Beta > 1.0**: High sensitivity. More volatile than the market (higher growth potential, higher risk).\n• **Beta < 1.0**: Low sensitivity. More defensive, holds up better in market downturns.\n\nYour portfolio's estimated beta depends on your stock selection. Tickers like TSLA and NVDA increase beta, whereas JNJ and PG lower it.`;
  }

  if (query.includes('pe ratio') || query.includes('p/e') || query.includes('price to earning')) {
    return `The **P/E (Price-to-Earnings) Ratio** is a key valuation metric calculated by dividing a stock's market price by its earnings per share (EPS).\n\n• **High P/E**: Suggests high future growth expectations (like tech stocks: NVDA, MSFT), but could be overvalued if growth slows.\n• **Low P/E**: Suggests value or undervaluation (like value stocks: JPM, JNJ), but could be a 'value trap' if the company is in decline.\n\nAlways compare P/E ratios within the same sector rather than across different industries.`;
  }

  if (query.includes('volatility') || query.includes('risk')) {
    return `**Portfolio Volatility** represents the standard deviation of your portfolio returns, showing how much your holdings fluctuate. Lower volatility means steadier growth, whereas high volatility means large swings in value. You can check your annualized volatility rating on the **Portfolio Health** page.`;
  }

  if (query.includes('rebalance') || query.includes('optimize')) {
    return `**Rebalancing** is the process of buying or selling assets to restore your portfolio to its target asset allocation weights. This controls risk exposure (e.g. trimming tech stocks after a rally) and helps buy low/sell high. You can view precise rebalancing orders in the **Optimizer** tab.`;
  }

  // 5. MOCK COGNITIVE AI REASONING FALLBACK (FINANCE ADVISOR)
  return `As your StockSense Portfolio Analyst, I specialize in investment analysis, portfolio diagnostics, and financial market concepts. \n\nTo help you analyze your portfolio, please ask me questions related to:\n\n1. **Your Portfolio**: 'What is my current net worth?', 'How is my TSLA stock doing?', 'Am I diversified?'\n2. **Concepts**: 'Explain Sharpe Ratio', 'What is HHI?', 'How does Value at Risk work?'\n3. **Decisions**: 'How do I rebalance my tech stocks?', 'Give me stock suggestions.'\n\nHow can I assist you with your investments today?`;
};
