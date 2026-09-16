import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Newspaper, 
  TrendingUp, 
  Sparkles, 
  Plus, 
  Zap, 
  Globe,
  Cpu,
  Flame,
  ShieldCheck,
  Landmark
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

interface NewsEventRecommendation {
  id: string;
  category: 'tech' | 'energy' | 'finance' | 'defense' | 'macro';
  title: string;
  date: string;
  source: string;
  summary: string;
  marketImpact: string;
  sentiment: 'Bullish' | 'Very Bullish' | 'Neutral-High Upside';
  sentimentScore: number; // 0 - 100
  beneficiaryStocks: {
    symbol: string;
    companyName: string;
    sector: string;
    currentPrice: number;
    targetPrice: number;
    projectedUpside: number; // percentage
    rating: 'Strong Buy' | 'Strategic Buy' | 'Growth Pick';
    impactRationale: string;
  }[];
}

const NEWS_EVENTS: NewsEventRecommendation[] = [
  {
    id: 'news-1',
    category: 'tech',
    title: 'Global AI Chip Demand Soars as Tech Giants Expand Data Centers',
    date: 'Today, 2 hours ago',
    source: 'Financial Express / Bloomberg',
    summary: 'Cloud hyperscalers have announced a collective $40B increase in annual capital expenditure dedicated to AI compute clusters and next-generation GPU servers.',
    marketImpact: 'Sustained tailwind for semiconductor hardware providers, cloud ecosystem leads, and high-efficiency thermal infrastructure suppliers.',
    sentiment: 'Very Bullish',
    sentimentScore: 94,
    beneficiaryStocks: [
      {
        symbol: 'NVDA',
        companyName: 'NVIDIA Corporation',
        sector: 'Technology',
        currentPrice: 680.00,
        targetPrice: 850.00,
        projectedUpside: 25.0,
        rating: 'Strong Buy',
        impactRationale: 'Primary hardware supplier powering 85%+ of global generative AI training servers.'
      },
      {
        symbol: 'MSFT',
        companyName: 'Microsoft Corporation',
        sector: 'Technology',
        currentPrice: 370.00,
        targetPrice: 445.00,
        projectedUpside: 20.2,
        rating: 'Strong Buy',
        impactRationale: 'Capturing enterprise AI monetization through Azure OpenAI & Copilot subscriptions.'
      },
      {
        symbol: 'AMZN',
        companyName: 'Amazon.com Inc.',
        sector: 'Technology',
        currentPrice: 178.40,
        targetPrice: 215.00,
        projectedUpside: 20.5,
        rating: 'Growth Pick',
        impactRationale: 'AWS acceleration driven by high-margin custom Bedrock AI instances.'
      }
    ]
  },
  {
    id: 'news-2',
    category: 'finance',
    title: 'Federal Reserve Signals Monetary Easing & Interest Rate Cuts',
    date: 'Yesterday',
    source: 'Wall Street Journal',
    summary: 'Cooling inflation metrics prompt central bank leaders to signal upcoming rate cuts, reducing borrowing costs for commercial banks and corporate borrowers.',
    marketImpact: 'Lowers corporate cost of capital, rejuvenates commercial lending activity, and boosts net interest margins for dominant retail financial institutions.',
    sentiment: 'Bullish',
    sentimentScore: 88,
    beneficiaryStocks: [
      {
        symbol: 'JPM',
        companyName: 'JPMorgan Chase & Co.',
        sector: 'Finance',
        currentPrice: 175.50,
        targetPrice: 210.00,
        projectedUpside: 19.6,
        rating: 'Strong Buy',
        impactRationale: 'Unrivaled balance sheet, poised for rebound in dealmaking and investment banking fees.'
      },
      {
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        sector: 'Technology',
        currentPrice: 182.50,
        targetPrice: 215.00,
        projectedUpside: 17.8,
        rating: 'Strategic Buy',
        impactRationale: 'Cheaper consumer credit drives consumer upgrade cycles for hardware hardware lineups.'
      }
    ]
  },
  {
    id: 'news-3',
    category: 'energy',
    title: 'Governments Unveil $25B Green Infrastructure Tax Credit Package',
    date: '3 days ago',
    source: 'Reuters Macro',
    summary: 'New legislation expands tax credits for clean grid storage, EV charging networks, and hybrid battery technology manufacturing.',
    marketImpact: 'Drives capital inflow into EV leaders and energy producers diversifying into clean energy grid storage.',
    sentiment: 'Bullish',
    sentimentScore: 82,
    beneficiaryStocks: [
      {
        symbol: 'TSLA',
        companyName: 'Tesla Motors Inc.',
        sector: 'Consumer & Clean Tech',
        currentPrice: 175.20,
        targetPrice: 230.00,
        projectedUpside: 31.2,
        rating: 'Growth Pick',
        impactRationale: 'Major direct beneficiary of battery storage tax credits and EV charging expansion.'
      },
      {
        symbol: 'XOM',
        companyName: 'Exxon Mobil Corp.',
        sector: 'Energy',
        currentPrice: 115.80,
        targetPrice: 135.00,
        projectedUpside: 16.5,
        rating: 'Strategic Buy',
        impactRationale: 'Expanding carbon capture initiatives qualifying for maximum government subsidies.'
      }
    ]
  },
  {
    id: 'news-4',
    category: 'macro',
    title: 'Consumer Staples & Healthcare Show Resilient Defensive Earnings Growth',
    date: '4 days ago',
    source: 'Financial Times',
    summary: 'Latest quarterly earning reports show consumer staple giants maintaining pricing power despite market volatility.',
    marketImpact: 'Provides defensive portfolio stabilization with steady dividend payouts during economic shifts.',
    sentiment: 'Neutral-High Upside',
    sentimentScore: 76,
    beneficiaryStocks: [
      {
        symbol: 'PG',
        companyName: 'Procter & Gamble Co.',
        sector: 'Consumer Staples',
        currentPrice: 158.40,
        targetPrice: 180.00,
        projectedUpside: 13.6,
        rating: 'Strategic Buy',
        impactRationale: '65+ year dividend aristocrat with pricing power to safeguard investor portfolios.'
      },
      {
        symbol: 'JNJ',
        companyName: 'Johnson & Johnson',
        sector: 'Healthcare',
        currentPrice: 160.20,
        targetPrice: 182.00,
        projectedUpside: 13.6,
        rating: 'Strategic Buy',
        impactRationale: 'AAA-rated medical tech balance sheet delivering dependable inflation-protected yields.'
      }
    ]
  }
];

export const NewsAdvisor: React.FC = () => {
  const { addHolding } = usePortfolio();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'tech' | 'energy' | 'finance' | 'macro'>('all');
  const [customHeadline, setCustomHeadline] = useState('');
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState(false);
  const [customAnalysisResult, setCustomAnalysisResult] = useState<any | null>(null);

  // Modal State for Purchasing
  const [selectedStockToBuy, setSelectedStockToBuy] = useState<any | null>(null);
  const [buyQty, setBuyQty] = useState<number>(10);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    document.title = "Current Affairs Stock Advisor — StockSense";
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCustomAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customHeadline.trim()) return;

    setIsAnalyzingCustom(true);
    setCustomAnalysisResult(null);

    setTimeout(() => {
      const headline = customHeadline.toLowerCase();
      let matchedStocks = [
        { symbol: 'NVDA', companyName: 'NVIDIA Corp.', sector: 'Tech', price: 680, target: 840, upside: 23.5, rationale: 'Matches high-performance compute and technology demand.' },
        { symbol: 'MSFT', companyName: 'Microsoft Corp.', sector: 'Tech', price: 370, target: 435, upside: 17.5, rationale: 'Leverages software scale and enterprise cloud expansion.' },
        { symbol: 'JPM', companyName: 'JPMorgan Chase', sector: 'Finance', price: 175.5, target: 205, upside: 16.8, rationale: 'Captures capital market expansion and transaction volumes.' }
      ];

      if (headline.includes('battery') || headline.includes('ev') || headline.includes('energy') || headline.includes('oil') || headline.includes('green')) {
        matchedStocks = [
          { symbol: 'TSLA', companyName: 'Tesla Inc.', sector: 'Clean Tech', price: 175.2, target: 235, upside: 34.1, rationale: 'Direct beneficiary of clean energy and EV policy shifts.' },
          { symbol: 'XOM', companyName: 'Exxon Mobil', sector: 'Energy', price: 115.8, target: 138, upside: 19.1, rationale: 'Strong commodity pricing and infrastructure scale.' },
          { symbol: 'NVDA', companyName: 'NVIDIA Corp.', sector: 'Tech', price: 680, target: 820, upside: 20.5, rationale: 'Automotive autonomous driving chip supplier.' }
        ];
      }

      setCustomAnalysisResult({
        headline: customHeadline,
        sentiment: 'Strong Bullish Catalyst',
        score: 91,
        summary: `AI Analysis detects positive sector momentum based on "${customHeadline}". High probability of capital inflows into relevant industry market leaders.`,
        recommendedStocks: matchedStocks
      });
      setIsAnalyzingCustom(false);
    }, 1200);
  };

  const handleBuySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockToBuy) return;

    try {
      await addHolding({
        symbol: selectedStockToBuy.symbol,
        companyName: selectedStockToBuy.companyName,
        quantity: Number(buyQty),
        buyPrice: selectedStockToBuy.currentPrice || selectedStockToBuy.price,
        currentPrice: selectedStockToBuy.currentPrice || selectedStockToBuy.price,
        purchaseDate: new Date().toISOString().split('T')[0]
      });

      triggerToast(`Added ${selectedStockToBuy.symbol} to your portfolio!`);
      setSelectedStockToBuy(null);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to add holding.');
    }
  };

  const filteredEvents = NEWS_EVENTS.filter(event => 
    selectedCategory === 'all' || event.category === selectedCategory
  );

  return (
    <DashboardLayout>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-8 text-left"
      >
        {/* Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -40, x: 40 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -40, x: 40 }}
              className="fixed top-4 right-4 bg-emerald-500 text-white py-3 px-5 rounded-lg shadow-xl font-semibold text-sm flex items-center gap-2 z-50 text-left"
            >
              <span>✅</span> {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-borderColor pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-accent rounded-xl">
                <Newspaper size={24} />
              </span>
              <h2 className="text-2xl font-bold text-textPrimary tracking-tight">
                Current Affairs Stock Advisor
              </h2>
            </div>
            <p className="text-sm text-textSecondary font-medium mt-1">
              AI-analyzed market recommendations driven by real-time news, economic policy, and macro events.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-900 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Macro Feed Connected</span>
          </div>
        </div>

        {/* CUSTOM NEWS ANALYZER BOX */}
        <Card className="p-6 relative overflow-hidden border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white">
          <div className="flex items-center gap-2 font-bold text-base text-textPrimary mb-2">
            <Sparkles className="text-accent" size={20} />
            <span>AI Current Affairs Headline Analyzer</span>
          </div>
          <p className="text-xs text-textSecondary mb-4">
            Have a breaking news story or market headline? Type it below to receive instant AI stock beneficiary recommendations.
          </p>

          <form onSubmit={handleCustomAnalyze} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                id="customHeadline"
                placeholder="e.g. Government announces $20B semiconductor subsidy package..."
                value={customHeadline}
                onChange={(e) => setCustomHeadline(e.target.value)}
                className="w-full bg-white"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              isLoading={isAnalyzingCustom}
              className="shrink-0 flex items-center gap-2"
            >
              <Zap size={16} />
              <span>Analyze & Suggest Stocks</span>
            </Button>
          </form>

          {/* Custom Analysis Result View */}
          <AnimatePresence>
            {customAnalysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="mt-6 bg-white/95 rounded-xl border border-indigo-200 p-5 shadow-md space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-50 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-accent uppercase tracking-wider">AI Event Analysis</span>
                    <h4 className="text-sm font-bold text-textPrimary">"{customAnalysisResult.headline}"</h4>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                    <span>🔥 {customAnalysisResult.sentiment}</span>
                    <span className="bg-emerald-600 text-white px-1.5 py-0.5 rounded text-[10px]">{customAnalysisResult.score}% Score</span>
                  </div>
                </div>

                <p className="text-xs text-textSecondary leading-relaxed">{customAnalysisResult.summary}</p>

                <div>
                  <h5 className="text-xs font-bold text-textPrimary mb-2 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-accent" />
                    <span>Top Beneficiary Stocks to Buy:</span>
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {customAnalysisResult.recommendedStocks.map((stk: any) => (
                      <div key={stk.symbol} className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-sm text-textPrimary">{stk.symbol}</span>
                            <span className="text-xs font-bold text-emerald-600">+{stk.upside}% Target</span>
                          </div>
                          <p className="text-[11px] text-textSecondary">{stk.companyName}</p>
                          <p className="text-[10px] text-indigo-900/80 mt-1 font-medium leading-normal">{stk.rationale}</p>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          fullWidth
                          className="text-xs py-1 mt-2"
                          onClick={() => setSelectedStockToBuy(stk)}
                        >
                          + Add {stk.symbol} (₹{stk.price})
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* CATEGORY FILTER TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-borderColor">
          {[
            { id: 'all', label: 'All Current Affairs', icon: Globe },
            { id: 'tech', label: 'AI & Semiconductors', icon: Cpu },
            { id: 'finance', label: 'Fed Rates & Banking', icon: Landmark },
            { id: 'energy', label: 'Green Energy & EV', icon: Flame },
            { id: 'macro', label: 'Defensive & Macro', icon: ShieldCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-accent text-white shadow-sm shadow-indigo-100'
                    : 'bg-white border border-borderColor text-textSecondary hover:text-textPrimary hover:bg-slate-50'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* EVENT RECOMMENDATION CARDS LIST */}
        <div className="space-y-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="p-6 space-y-5 border border-borderColor/80 hover:border-indigo-200 transition-all">
              {/* Event Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-borderColor/50 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-textSecondary">
                    <span className="font-semibold text-accent uppercase tracking-wider">{event.category} Event</span>
                    <span>•</span>
                    <span>{event.date}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-500">{event.source}</span>
                  </div>
                  <h3 className="text-lg font-bold text-textPrimary flex items-center gap-2">
                    <span>{event.title}</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl shrink-0">
                  <span className="text-xs font-bold text-emerald-800">Market Impact: {event.sentiment}</span>
                  <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {event.sentimentScore}% Bullish
                  </span>
                </div>
              </div>

              {/* Event Summary & Market Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  <p className="font-bold text-textPrimary mb-1">📰 Current Affair Summary:</p>
                  <p className="text-textSecondary leading-relaxed">{event.summary}</p>
                </div>
                <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
                  <p className="font-bold text-indigo-950 mb-1">💡 Financial & Sector Impact:</p>
                  <p className="text-indigo-900/90 leading-relaxed">{event.marketImpact}</p>
                </div>
              </div>

              {/* Recommended Beneficiary Stocks Table */}
              <div>
                <h4 className="text-xs font-bold text-textPrimary mb-3 flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-accent" />
                  <span>Recommended Beneficiary Stocks to Buy:</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {event.beneficiaryStocks.map((stock) => (
                    <div
                      key={stock.symbol}
                      className="bg-white rounded-xl border border-borderColor p-4 flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-base text-textPrimary">{stock.symbol}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {stock.rating}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-textSecondary">{stock.companyName}</p>
                        <p className="text-[11px] font-semibold text-accent mt-0.5">{stock.sector}</p>

                        <div className="my-3 pt-2 border-t border-slate-100 flex justify-between items-baseline text-xs">
                          <div>
                            <span className="text-[10px] text-textSecondary block">Price</span>
                            <span className="font-bold text-textPrimary">{formatCurrency(stock.currentPrice)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-textSecondary block">Target / Upside</span>
                            <span className="font-bold text-emerald-600">
                              {formatCurrency(stock.targetPrice)} (+{stock.projectedUpside}%)
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-textSecondary leading-normal bg-slate-50 p-2 rounded border border-slate-100">
                          {stock.impactRationale}
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        fullWidth
                        size="sm"
                        className="flex items-center justify-center gap-1.5 text-xs py-2 mt-2"
                        onClick={() => setSelectedStockToBuy(stock)}
                      >
                        <Plus size={14} />
                        <span>Add {stock.symbol} to Portfolio</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* PURCHASE MODAL */}
        {selectedStockToBuy && (
          <Modal
            isOpen={!!selectedStockToBuy}
            onClose={() => setSelectedStockToBuy(null)}
            title={`Buy ${selectedStockToBuy.symbol} — ${selectedStockToBuy.companyName}`}
          >
            <form onSubmit={handleBuySubmit} className="space-y-4 text-left">
              <p className="text-xs text-textSecondary leading-relaxed">
                Add this recommended current affair beneficiary stock to your paper trading portfolio.
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-borderColor space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-textSecondary">Execution Price:</span>
                  <span className="font-bold text-textPrimary">{formatCurrency(selectedStockToBuy.currentPrice || selectedStockToBuy.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textSecondary">Target Upside:</span>
                  <span className="font-bold text-emerald-600">+{selectedStockToBuy.projectedUpside || selectedStockToBuy.upside}%</span>
                </div>
              </div>

              <Input
                id="buyQty"
                type="number"
                label="Number of Shares to Buy"
                value={buyQty}
                min={1}
                onChange={(e) => setBuyQty(Number(e.target.value))}
                required
              />

              <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 text-xs flex justify-between font-bold text-indigo-950">
                <span>Total Investment Value:</span>
                <span className="text-accent">{formatCurrency((selectedStockToBuy.currentPrice || selectedStockToBuy.price) * buyQty)}</span>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="primary" fullWidth>
                  Confirm & Add to Portfolio
                </Button>
                <Button type="button" variant="outline" fullWidth onClick={() => setSelectedStockToBuy(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default NewsAdvisor;
