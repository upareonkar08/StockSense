import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Plus, 
  Check, 
  Search, 
  ShieldAlert, 
  Award, 
  Heart, 
  TrendingUp, 
  AlertTriangle, 
  Settings2
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { usePortfolio } from '../hooks/usePortfolio';
import { formatCurrency } from '../utils/formatters';

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } }
};

interface SuggestedStock {
  symbol: string;
  companyName: string;
  sector: string;
  price: number;
  rating: 'Strong Buy' | 'Buy' | 'Hold';
  category: 'diversification' | 'growth' | 'dividend';
  rationale: string;
  metric: string;
  metricLabel: string;
}

const SUGGESTED_STOCKS: SuggestedStock[] = [
  {
    symbol: 'JPM',
    companyName: 'JPMorgan Chase & Co.',
    sector: 'Finance',
    price: 175.50,
    rating: 'Strong Buy',
    category: 'diversification',
    rationale: 'Excellent balance sheet and strong dividend growth. Recommended to hedge high technology concentration.',
    metric: '12.4x',
    metricLabel: 'P/E Ratio'
  },
  {
    symbol: 'JNJ',
    companyName: 'Johnson & Johnson',
    sector: 'Healthcare',
    price: 160.20,
    rating: 'Buy',
    category: 'diversification',
    rationale: 'AAA-rated defensive anchor. Recommended for steady income and low-volatility portfolio core stabilization.',
    metric: '3.1%',
    metricLabel: 'Dividend Yield'
  },
  {
    symbol: 'XOM',
    companyName: 'Exxon Mobil Corp.',
    sector: 'Energy',
    price: 115.80,
    rating: 'Buy',
    category: 'diversification',
    rationale: 'Generates robust free cash flow. A strong inflation hedge to capture cyclical commodities growth.',
    metric: '3.3%',
    metricLabel: 'Dividend Yield'
  },
  {
    symbol: 'NVDA',
    companyName: 'NVIDIA Corp.',
    sector: 'Technology',
    price: 680.00,
    rating: 'Strong Buy',
    category: 'growth',
    rationale: 'Undisputed AI hardware market leader. High valuation but sustained secular tailwinds and massive revenue growth.',
    metric: '265%',
    metricLabel: 'Revenue YoY Growth'
  },
  {
    symbol: 'PG',
    companyName: 'Procter & Gamble',
    sector: 'Consumer',
    price: 158.40,
    rating: 'Buy',
    category: 'dividend',
    rationale: 'Staples giant with 65+ consecutive years of dividend increases. Defensive product line with high pricing power.',
    metric: '2.4%',
    metricLabel: 'Dividend Yield'
  },
  {
    symbol: 'MSFT',
    companyName: 'Microsoft Corp.',
    sector: 'Technology',
    price: 370.00,
    rating: 'Strong Buy',
    category: 'growth',
    rationale: 'Strong enterprise software cloud leader. Capturing extensive growth through OpenAI partnership integrations.',
    metric: '30.2%',
    metricLabel: 'Operating Margin'
  }
];

// Universal Stock definitions with expected returns & risk ratings for plan advisory matching
interface StockDefinition {
  symbol: string;
  companyName: string;
  sector: string;
  price: number;
  expectedReturn: number;
  risk: 'low' | 'medium' | 'high';
  rationale: string;
}

const STOCK_DEFINITIONS: Record<string, StockDefinition> = {
  AAPL: { symbol: 'AAPL', companyName: 'Apple Inc.', sector: 'Technology', price: 182.50, expectedReturn: 12, risk: 'medium', rationale: 'Strong brand equity and ecosystem stickiness with stable earnings growth.' },
  MSFT: { symbol: 'MSFT', companyName: 'Microsoft Corp.', sector: 'Technology', price: 370.00, expectedReturn: 14, risk: 'medium', rationale: 'Enterprise software leader with major secular tailwinds in cloud and AI.' },
  TSLA: { symbol: 'TSLA', companyName: 'Tesla Inc.', sector: 'Consumer', price: 175.20, expectedReturn: 18, risk: 'high', rationale: 'Market leader in EVs, high volatility but strong growth potential.' },
  GOOGL: { symbol: 'GOOGL', companyName: 'Alphabet Inc.', sector: 'Technology', price: 145.80, expectedReturn: 11, risk: 'medium', rationale: 'Dominant search business combined with cloud expansion and deep AI research.' },
  NVDA: { symbol: 'NVDA', companyName: 'NVIDIA Corp.', sector: 'Technology', price: 680.00, expectedReturn: 25, risk: 'high', rationale: 'Undisputed hardware leader in high-performance GPU and AI acceleration computing.' },
  AMZN: { symbol: 'AMZN', companyName: 'Amazon.com Inc.', sector: 'Consumer', price: 178.40, expectedReturn: 13, risk: 'medium', rationale: 'Cloud infrastructure dominance (AWS) coupled with retail logistics scale.' },
  JPM: { symbol: 'JPM', companyName: 'JPMorgan Chase & Co.', sector: 'Finance', price: 175.50, expectedReturn: 9, risk: 'medium', rationale: 'Largest US commercial banking operations with stable net interest margins.' },
  JNJ: { symbol: 'JNJ', companyName: 'Johnson & Johnson', sector: 'Healthcare', price: 160.20, expectedReturn: 6, risk: 'low', rationale: 'AAA-rated defensive pharmaceutical giant offering a stable business profile.' },
  XOM: { symbol: 'XOM', companyName: 'Exxon Mobil Corp.', sector: 'Energy', price: 115.80, expectedReturn: 8, risk: 'medium', rationale: 'Robust free cash flows, strong energy demand commodity cycles hedge.' },
  PG: { symbol: 'PG', companyName: 'Procter & Gamble Co.', sector: 'Consumer', price: 158.40, expectedReturn: 7, risk: 'low', rationale: 'Staples leader with strong pricing power and long histories of payout growth.' }
};

export const Suggestions: React.FC = () => {
  const { holdings, addHolding, updateHolding, deleteHolding } = usePortfolio();
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'explore' | 'planner'>('explore');

  // General tab states
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'diversification' | 'growth' | 'dividend'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addStock, setAddStock] = useState<SuggestedStock | null>(null);
  const [quantity, setQuantity] = useState<number>(10);
  const [buyPrice, setBuyPrice] = useState<number>(100);
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Personalized Planner states
  const [planAmount, setPlanAmount] = useState<number>(50000);
  const [planHorizon, setPlanHorizon] = useState<number>(5);
  const [planReturn, setPlanReturn] = useState<number>(8);
  const [hasGeneratedPlan, setHasGeneratedPlan] = useState<boolean>(false);

  // Cash storage for mock executions
  const [paperCash, setPaperCash] = useState<number>(100000);

  const getUserId = () => {
    const userJson = localStorage.getItem('stocksense_user');
    if (userJson) {
      try {
        const userObj = JSON.parse(userJson);
        return userObj.id || userObj.email || 'guest';
      } catch (e) {}
    }
    return 'guest';
  };

  const userId = getUserId();
  const cashKey = `stocksense_cash_${userId}`;

  useEffect(() => {
    const storedCash = localStorage.getItem(cashKey);
    if (storedCash) {
      setPaperCash(Number(storedCash));
    } else {
      localStorage.setItem(cashKey, '100000');
    }
  }, [cashKey]);

  React.useEffect(() => {
    document.title = "Investment Suggestions — StockSense";
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAddModal = (stock: SuggestedStock) => {
    setAddStock(stock);
    setBuyPrice(stock.price);
    setQuantity(10);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStock) return;

    try {
      await addHolding({
        symbol: addStock.symbol,
        companyName: addStock.companyName,
        quantity: Number(quantity),
        buyPrice: Number(buyPrice),
        currentPrice: addStock.price,
        purchaseDate: purchaseDate
      });

      triggerToast(`Added ${addStock.symbol} to your portfolio!`);
      setAddStock(null);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to add stock. Please try again.');
    }
  };

  // General suggestions filter
  const filteredSuggestions = SUGGESTED_STOCKS.filter(stock => {
    const matchesCategory = selectedCategory === 'all' || stock.category === selectedCategory;
    const matchesSearch = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          stock.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          stock.sector.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'diversification':
        return <ShieldAlert className="text-warning" size={18} />;
      case 'growth':
        return <TrendingUp className="text-success" size={18} />;
      case 'dividend':
        return <Heart className="text-danger" size={18} />;
      default:
        return <Award className="text-accent" size={18} />;
    }
  };

  // Generate advisor portfolio
  const getAdvisorRecommendations = () => {
    const allowedRisks: string[] = ['low'];
    if (planHorizon >= 3) allowedRisks.push('medium');
    if (planHorizon >= 5) allowedRisks.push('high');

    const stockList = Object.values(STOCK_DEFINITIONS);
    
    // 1. Filter by minimum return target
    let eligible = stockList.filter(s => s.expectedReturn >= planReturn);
    let warning = '';

    if (eligible.length === 0) {
      const maxReturn = Math.max(...stockList.map(s => s.expectedReturn));
      eligible = stockList.filter(s => s.expectedReturn === maxReturn);
      warning = `No assets meet your target of ${planReturn}% return. Recommending our highest-yielding assets instead.`;
    }

    // 2. Filter by risk capacity based on horizon
    let filtered = eligible.filter(s => allowedRisks.includes(s.risk));
    if (filtered.length === 0) {
      filtered = eligible;
      warning = `Note: Reaching ${planReturn}% return in ${planHorizon} year(s) requires higher-risk assets than recommended.`;
    }

    // Sort by return descending and limit to top 3 stocks
    filtered.sort((a, b) => b.expectedReturn - a.expectedReturn);
    const selected = filtered.slice(0, 3);

    // Distribute budget
    const allocations = selected.map(stock => {
      const shareBudget = planAmount / selected.length;
      const sharesToBuy = Math.floor(shareBudget / stock.price);
      const totalCost = sharesToBuy * stock.price;

      return {
        ...stock,
        sharesToBuy,
        totalCost,
        weight: planAmount > 0 ? (totalCost / planAmount) * 100 : 0
      };
    }).filter(a => a.sharesToBuy > 0);

    const totalAllocated = allocations.reduce((sum, item) => sum + item.totalCost, 0);
    const remainingCash = planAmount - totalAllocated;

    return {
      buys: allocations,
      totalAllocated,
      remainingCash,
      warning
    };
  };

  // Generate sell recommendations based on plan target and horizon risk
  const getSellRecommendations = () => {
    const allowedRisks: string[] = ['low'];
    if (planHorizon >= 3) allowedRisks.push('medium');
    if (planHorizon >= 5) allowedRisks.push('high');

    const sells: { symbol: string; qty: number; value: number; type: 'RETURN_LOW' | 'RISK_HIGH'; rationale: string }[] = [];

    holdings.forEach(h => {
      const def = STOCK_DEFINITIONS[h.symbol];
      if (!def) return;

      const isReturnLow = def.expectedReturn < planReturn;
      const isRiskHigh = !allowedRisks.includes(def.risk);

      if (isReturnLow) {
        sells.push({
          symbol: h.symbol,
          qty: h.quantity,
          value: h.quantity * h.currentPrice,
          type: 'RETURN_LOW',
          rationale: `Expected annual return of ${def.expectedReturn}% is below your target of ${planReturn}%.`
        });
      } else if (isRiskHigh) {
        sells.push({
          symbol: h.symbol,
          qty: h.quantity,
          value: h.quantity * h.currentPrice,
          type: 'RISK_HIGH',
          rationale: `Holding risk (${def.risk.toUpperCase()}) exceeds horizon threshold for ${planHorizon} year(s).`
        });
      }
    });

    return sells;
  };

  const { buys, totalAllocated, remainingCash, warning } = getAdvisorRecommendations();
  const sells = getSellRecommendations();

  // compound calculations
  const futureValue = planAmount * Math.pow((1 + (planReturn / 100)), planHorizon);
  const totalGrowth = futureValue - planAmount;
  const growthPercent = planAmount > 0 ? (totalGrowth / planAmount) * 100 : 0;

  // Execute Recommended Buys
  const handleExecuteBuys = async () => {
    if (buys.length === 0) return;
    if (totalAllocated > paperCash) {
      triggerToast(`⚠️ Insufficient cash! Available: ${formatCurrency(paperCash)}, Required: ${formatCurrency(totalAllocated)}`);
      return;
    }

    try {
      let cashDeducted = 0;
      for (const buy of buys) {
        const existing = holdings.find(h => h.symbol === buy.symbol);
        if (existing) {
          await updateHolding(existing.id, {
            quantity: existing.quantity + buy.sharesToBuy,
            currentPrice: buy.price
          });
        } else {
          await addHolding({
            symbol: buy.symbol,
            companyName: buy.companyName,
            quantity: buy.sharesToBuy,
            buyPrice: buy.price,
            currentPrice: buy.price,
            purchaseDate: new Date().toISOString().split('T')[0]
          });
        }
        cashDeducted += buy.totalCost;
      }

      const newCash = paperCash - cashDeducted;
      setPaperCash(newCash);
      localStorage.setItem(cashKey, String(newCash));
      triggerToast(`Successfully purchased recommended shares! Balance: ${formatCurrency(newCash)}`);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to execute buy recommendations.");
    }
  };

  // Execute Recommended Sells
  const handleExecuteSells = async () => {
    if (sells.length === 0) return;

    try {
      let cashEarned = 0;
      for (const sell of sells) {
        const existing = holdings.find(h => h.symbol === sell.symbol);
        if (existing) {
          await deleteHolding(existing.id);
          cashEarned += sell.value;
        }
      }

      const newCash = paperCash + cashEarned;
      setPaperCash(newCash);
      localStorage.setItem(cashKey, String(newCash));
      triggerToast(`Successfully reallocated assets. Added ${formatCurrency(cashEarned)} to cash!`);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to execute sell recommendations.");
    }
  };

  // Cash Top-Up helper for testing/prototyping
  const handleCashTopUp = () => {
    const newCash = paperCash + 100000;
    setPaperCash(newCash);
    localStorage.setItem(cashKey, String(newCash));
    triggerToast(`Added ${formatCurrency(100000)} to paper trading account!`);
  };

  return (
    <DashboardLayout>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-8 text-left"
      >
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-textPrimary tracking-tight flex items-center gap-2">
              <Sparkles size={24} className="text-accent" />
              <span>Investment Suggestions</span>
            </h2>
            <p className="text-sm text-textSecondary font-medium">
              Curated buy recommendations to optimize and diversify your holdings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-borderColor py-1.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span className="text-textSecondary">Paper cash:</span>
              <span className="font-extrabold text-textPrimary">{formatCurrency(paperCash)}</span>
            </div>
            <button
              onClick={handleCashTopUp}
              className="bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-accent py-1.5 px-3 rounded-lg text-xs font-bold transition-all"
            >
              + Top-up Cash
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-borderColor">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-5 py-2 text-xs font-bold border-b-2 transition-all uppercase tracking-wider ${
              activeTab === 'explore'
                ? 'border-accent text-accent'
                : 'border-transparent text-textSecondary hover:text-textPrimary'
            }`}
          >
            Explore Recommendations
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-5 py-2 text-xs font-bold border-b-2 transition-all uppercase tracking-wider flex items-center gap-1.5 ${
              activeTab === 'planner'
                ? 'border-accent text-accent'
                : 'border-transparent text-textSecondary hover:text-textPrimary'
            }`}
          >
            <Settings2 size={14} />
            <span>Personalized Planner</span>
          </button>
        </div>

        {/* Success Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -40, x: 40 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -40, x: 40 }}
              className="fixed top-4 right-4 bg-emerald-500 text-white py-3 px-5 rounded-lg shadow-xl font-semibold text-sm flex items-center gap-2 z-50"
            >
              <span>✅</span> {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'explore' ? (
          <>
            {/* Toolbar: Category Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-borderColor shadow-sm">
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-1 bg-slate-50 border border-borderColor p-1 rounded-lg w-full sm:w-auto">
                {([
                  { id: 'all', label: 'All Recommendations' },
                  { id: 'diversification', label: 'Diversification' },
                  { id: 'growth', label: 'Growth' },
                  { id: 'dividend', label: 'Dividends' }
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      selectedCategory === tab.id
                        ? 'bg-white text-accent shadow-sm border border-borderColor/50'
                        : 'text-textSecondary hover:text-textPrimary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ticker, company..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-xs font-medium border border-borderColor rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-slate-50/50"
                />
              </div>
            </div>

            {/* Suggestions Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSuggestions.length === 0 ? (
                <div className="col-span-full py-16 text-center">
                  <span className="text-4xl">🔍</span>
                  <h4 className="text-sm font-bold text-textPrimary mt-3">No suggestions match your filters.</h4>
                  <p className="text-xs text-textSecondary mt-1">Try resetting your search query or choosing another category.</p>
                </div>
              ) : (
                filteredSuggestions.map((stock, index) => {
                  const isAlreadyAdded = holdings.some(h => h.symbol === stock.symbol);
                  
                  return (
                    <motion.div
                      key={stock.symbol}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="h-full"
                    >
                      <Card hoverEffect className="flex flex-col justify-between h-full space-y-5 text-left border border-borderColor">
                        {/* Top Row: Symbol and Rating Badge */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 rounded-lg bg-slate-50 border border-borderColor flex items-center justify-center font-bold text-textPrimary text-sm">
                              {stock.symbol}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-textPrimary leading-none">{stock.companyName}</h4>
                              <span className="text-[10px] text-textSecondary font-semibold mt-1 inline-block">{stock.sector}</span>
                            </div>
                          </div>
                          
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            stock.rating === 'Strong Buy' 
                              ? 'bg-emerald-50 text-success border border-emerald-100' 
                              : stock.rating === 'Buy'
                              ? 'bg-indigo-50 text-accent border border-indigo-100'
                              : 'bg-slate-100 text-textSecondary'
                          }`}>
                            {stock.rating}
                          </span>
                        </div>

                        {/* Rationale description */}
                        <div className="flex-grow space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-textPrimary">
                            {getCategoryIcon(stock.category)}
                            <span className="capitalize">{stock.category} Recommendation</span>
                          </div>
                          <p className="text-[11px] text-textSecondary font-medium leading-relaxed">
                            {stock.rationale}
                          </p>
                        </div>

                        {/* Stats panel */}
                        <div className="grid grid-cols-2 gap-3 py-2 px-3 bg-slate-50 rounded-lg text-xs border border-borderColor/50">
                          <div>
                            <span className="text-[10px] text-textSecondary font-bold block uppercase tracking-wider">Mkt Price</span>
                            <span className="font-bold text-textPrimary text-sm mt-0.5 block">{formatCurrency(stock.price)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-textSecondary font-bold block uppercase tracking-wider">{stock.metricLabel}</span>
                            <span className="font-bold text-accent text-sm mt-0.5 block">{stock.metric}</span>
                          </div>
                        </div>

                        {/* Add to Portfolio button */}
                        <Button
                          variant={isAlreadyAdded ? 'outline' : 'primary'}
                          fullWidth
                          onClick={() => handleOpenAddModal(stock)}
                          className="flex items-center justify-center gap-1.5 text-xs py-2.5 font-bold"
                        >
                          {isAlreadyAdded ? (
                            <>
                              <Check size={14} className="text-success" />
                              <span>Add More Shares</span>
                            </>
                          ) : (
                            <>
                              <Plus size={14} />
                              <span>Add to Portfolio</span>
                            </>
                          )}
                        </Button>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* PERSONALIZED ADVISOR TAB CONTENT */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Input Form Column */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="space-y-4 border border-borderColor">
                <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                  <Settings2 size={16} className="text-accent" />
                  <span>Advisor Parameters</span>
                </h3>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setHasGeneratedPlan(true);
                  }}
                  className="space-y-4"
                >
                  <Input
                    id="planAmount"
                    type="number"
                    label="Investment Budget (₹)"
                    value={planAmount}
                    onChange={e => setPlanAmount(Number(e.target.value))}
                    min={100}
                    required
                  />

                  <Input
                    id="planHorizon"
                    type="number"
                    label="Investment Horizon (Years)"
                    value={planHorizon}
                    onChange={e => setPlanHorizon(Number(e.target.value))}
                    min={1}
                    max={30}
                    required
                  />

                  <Input
                    id="planReturn"
                    type="number"
                    label="Target Return (% per Year)"
                    value={planReturn}
                    onChange={e => setPlanReturn(Number(e.target.value))}
                    min={1}
                    max={100}
                    required
                  />

                  <Button type="submit" variant="primary" fullWidth className="font-bold uppercase tracking-wider py-3 text-xs">
                    Calculate & Advise
                  </Button>
                </form>
              </Card>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-2 space-y-6">
              {!hasGeneratedPlan ? (
                <div className="bg-slate-50 border border-borderColor border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="h-14 w-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-accent">
                    <Settings2 size={26} className="animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <h4 className="text-sm font-bold text-textPrimary">Investment Advisory Planner</h4>
                    <p className="text-xs text-textSecondary leading-relaxed">
                      Enter your budget, investment duration, and target returns on the left to generate customized BUY and SELL allocations.
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Projections Panel */}
                  <Card className="p-6 border border-borderColor bg-gradient-to-br from-white to-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-borderColor/70 text-left">
                      
                      <div className="space-y-1">
                        <span className="text-[10px] text-textSecondary uppercase font-extrabold tracking-wider">Initial Outlay</span>
                        <p className="text-2xl font-black text-textPrimary leading-none">{formatCurrency(planAmount)}</p>
                        <span className="text-[10px] text-textSecondary font-semibold inline-block">Starting Principal</span>
                      </div>

                      <div className="space-y-1 md:pl-6">
                        <span className="text-[10px] text-textSecondary uppercase font-extrabold tracking-wider">Estimated End Value</span>
                        <p className="text-2xl font-black text-accent leading-none">{formatCurrency(futureValue)}</p>
                        <span className="text-[10px] text-success font-bold flex items-center gap-0.5">
                          <TrendingUp size={12} />
                          <span>+{growthPercent.toFixed(1)}% total returns</span>
                        </span>
                      </div>

                      <div className="space-y-1 md:pl-6">
                        <span className="text-[10px] text-textSecondary uppercase font-extrabold tracking-wider">Advisor Allocation</span>
                        <p className="text-base font-extrabold text-textPrimary leading-none capitalize mt-1">
                          {planHorizon >= 5 ? '🎯 Growth Portfolio' : planHorizon >= 3 ? '⚖️ Balanced Portfolio' : '🛡️ Defensive Portfolio'}
                        </p>
                        <p className="text-[10px] text-textSecondary leading-normal mt-1 max-w-[200px]">
                          Derived from your target horizon of <strong>{planHorizon} Year(s)</strong>.
                        </p>
                      </div>

                    </div>
                  </Card>

                  {/* Warning Alerts */}
                  {(warning || buys.length === 0) && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs leading-relaxed flex gap-2.5">
                      <AlertTriangle className="shrink-0 text-amber-500 mt-0.5" size={16} />
                      <div>
                        <p className="font-bold text-amber-900">Portfolio Advisory Note</p>
                        <p className="mt-0.5 text-amber-800/90 font-medium">
                          {buys.length === 0 
                            ? `Your budget of ${formatCurrency(planAmount)} is insufficient to purchase shares of recommended companies. Try increasing your investment budget.`
                            : warning
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {/* BUY Recommendations */}
                  {buys.length > 0 && (
                    <Card className="p-0 overflow-hidden border border-borderColor">
                      <div className="px-6 py-4 border-b border-borderColor bg-emerald-50/50 flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="h-2 w-2 bg-emerald-500 rounded-full" />
                            <span>Recommended Buy Portfolios</span>
                          </h3>
                          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                            Qualifying allocations meeting or exceeding your target return of {planReturn}%.
                          </p>
                        </div>
                        <Button 
                          onClick={handleExecuteBuys} 
                          variant="primary" 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1 px-3"
                        >
                          Execute Suggested Buys
                        </Button>
                      </div>

                      <div className="overflow-x-auto w-full">
                        <table className="min-w-full divide-y divide-borderColor/70 text-xs text-left">
                          <thead>
                            <tr className="bg-slate-50 text-textSecondary font-bold">
                              <th className="px-5 py-2.5">Company</th>
                              <th className="px-5 py-2.5 text-center">Expected Return</th>
                              <th className="px-5 py-2.5 text-center">Risk Level</th>
                              <th className="px-5 py-2.5 text-right">Shares to Buy</th>
                              <th className="px-5 py-2.5 text-right">Allocation (Cost)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-borderColor/50 font-medium">
                            {buys.map(buy => (
                              <tr key={buy.symbol} className="hover:bg-slate-50/50">
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-textPrimary bg-slate-100 border border-borderColor px-1.5 py-0.5 rounded">{buy.symbol}</span>
                                    <div>
                                      <span className="font-bold text-textPrimary block">{buy.companyName}</span>
                                      <span className="text-[9px] text-textSecondary font-semibold capitalize">{buy.sector}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3 text-center text-emerald-600 font-extrabold text-sm">{buy.expectedReturn}% p.a.</td>
                                <td className="px-5 py-3 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold capitalize ${
                                    buy.risk === 'low' 
                                      ? 'bg-emerald-50 text-success' 
                                      : buy.risk === 'medium'
                                      ? 'bg-amber-50 text-amber-600'
                                      : 'bg-red-50 text-danger'
                                  }`}>
                                    {buy.risk}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-right font-bold text-textPrimary">{buy.sharesToBuy}</td>
                                <td className="px-5 py-3 text-right">
                                  <span className="font-extrabold text-textPrimary block">{formatCurrency(buy.totalCost)}</span>
                                  <span className="text-[9px] text-textSecondary font-semibold">{buy.weight.toFixed(1)}% weight</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="bg-slate-50 p-4 border-t border-borderColor/50 flex justify-between items-center text-xs font-semibold text-textSecondary">
                        <span>Total Portfolio Capital Cost: {formatCurrency(totalAllocated)}</span>
                        <span>Remaining Unallocated Cash: {formatCurrency(remainingCash)}</span>
                      </div>
                    </Card>
                  )}

                  {/* SELL Recommendations */}
                  <Card className="p-0 overflow-hidden border border-borderColor">
                    <div className="px-6 py-4 border-b border-borderColor bg-red-50/50 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="h-2 w-2 bg-red-500 rounded-full" />
                          <span>Recommended Sell / Trimming Actions</span>
                        </h3>
                        <p className="text-[10px] text-red-700 font-medium mt-0.5">
                          Existing assets in your portfolio violating your target return ({planReturn}%) or time volatility parameters.
                        </p>
                      </div>
                      {sells.length > 0 && (
                        <Button 
                          onClick={handleExecuteSells} 
                          variant="danger" 
                          className="font-bold text-[10px] py-1 px-3"
                        >
                          Execute Suggested Sells
                        </Button>
                      )}
                    </div>

                    {sells.length === 0 ? (
                      <div className="p-8 text-center text-xs text-textSecondary font-medium">
                        🎉 All active portfolio holdings align with your return and risk duration expectations. No reallocations needed.
                      </div>
                    ) : (
                      <div className="overflow-x-auto w-full">
                        <table className="min-w-full divide-y divide-borderColor/70 text-xs text-left">
                          <thead>
                            <tr className="bg-slate-50 text-textSecondary font-bold">
                              <th className="px-5 py-2.5">Asset</th>
                              <th className="px-5 py-2.5 text-center">Holding Size</th>
                              <th className="px-5 py-2.5 text-right">Value (₹)</th>
                              <th className="px-5 py-2.5">Trimming Rationale</th>
                              <th className="px-5 py-2.5 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-borderColor/50 font-medium">
                            {sells.map(sell => (
                              <tr key={sell.symbol} className="hover:bg-slate-50/50">
                                <td className="px-5 py-3">
                                  <span className="font-extrabold text-textPrimary bg-slate-100 border border-borderColor px-1.5 py-0.5 rounded">{sell.symbol}</span>
                                </td>
                                <td className="px-5 py-3 text-center font-bold text-textPrimary">{sell.qty} shares</td>
                                <td className="px-5 py-3 text-right font-extrabold text-textPrimary">{formatCurrency(sell.value)}</td>
                                <td className="px-5 py-3 text-textSecondary leading-normal font-medium max-w-xs">{sell.rationale}</td>
                                <td className="px-5 py-3 text-center">
                                  <span className="bg-red-50 text-danger border border-red-100 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                    {sell.type === 'RETURN_LOW' ? 'SELL / UNDERPERFORMANCE' : 'SELL / VOLATILITY'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}
            </div>

          </div>
        )}
      </motion.div>

      {/* ADD STOCK MODAL */}
      <Modal
        isOpen={addStock !== null}
        onClose={() => setAddStock(null)}
        title={addStock ? `Add ${addStock.symbol} to Portfolio` : 'Add Stock'}
      >
        {addStock && (
          <form onSubmit={handleAddSubmit} className="space-y-4 text-left">
            <div className="bg-slate-50 p-3 rounded-lg border border-borderColor flex justify-between items-center text-xs mb-2">
              <div>
                <span className="font-bold text-textPrimary block">{addStock.companyName}</span>
                <span className="text-[10px] text-textSecondary">{addStock.sector} Sector</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-textSecondary block uppercase font-bold">Suggested Price</span>
                <span className="font-extrabold text-accent">{formatCurrency(addStock.price)}</span>
              </div>
            </div>

            <Input
              id="quantity"
              type="number"
              label="Quantity to Add"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              required
              min={1}
            />

            <Input
              id="buyPrice"
              type="number"
              step="0.01"
              label="Buy Price (₹)"
              value={buyPrice}
              onChange={e => setBuyPrice(Number(e.target.value))}
              required
              min={0.01}
            />

            <Input
              id="purchaseDate"
              type="date"
              label="Purchase Date"
              value={purchaseDate}
              onChange={e => setPurchaseDate(e.target.value)}
              required
              min="2000-01-01"
            />

            <div className="pt-4 flex gap-3">
              <Button type="submit" variant="primary" fullWidth>
                Add shares to Portfolio
              </Button>
              <Button type="button" variant="outline" fullWidth onClick={() => setAddStock(null)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default Suggestions;
