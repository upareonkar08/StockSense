import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check, Search, DollarSign, Activity, RefreshCw, Lock, Sliders, Globe } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { usePortfolio } from '../hooks/usePortfolio';
import { formatCurrency } from '../utils/formatters';

declare global {
  interface Window {
    TradingView: any;
  }
}

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } }
};

interface TradeRecord {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  qty: number;
  price: number;
  total: number;
  time: string;
  status: string;
}

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

export const Trading: React.FC = () => {
  const { holdings, addHolding, updateHolding, deleteHolding } = usePortfolio();

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
  const tradesKey = `stocksense_trades_${userId}`;
  
  const [selectedTicker, setSelectedTicker] = useState('AAPL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState<number>(10);
  const [limitPrice, setLimitPrice] = useState<number>(STOCK_PRICES['AAPL']);
  const [cashBalance, setCashBalance] = useState<number>(100000);
  
  const [broker, setBroker] = useState<'paper' | 'alpaca' | 'zerodha'>('paper');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkedStatus, setLinkedStatus] = useState<'unlinked' | 'linked'>('unlinked');
  
  const [bids, setBids] = useState<{ price: number; size: number }[]>([]);
  const [asks, setAsks] = useState<{ price: number; size: number }[]>([]);
  
  const [executedTrade, setExecutedTrade] = useState<TradeRecord | null>(null);
  
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedCash = localStorage.getItem(cashKey);
    if (storedCash) {
      setCashBalance(Number(storedCash));
    } else {
      localStorage.setItem(cashKey, '100000');
    }

    const storedTrades = localStorage.getItem(tradesKey);
    if (storedTrades) {
      try {
        setTradeHistory(JSON.parse(storedTrades));
      } catch (e) {
        console.error(e);
      }
    }
  }, [cashKey, tradesKey]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const scriptId = 'tradingview-widget-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initWidget = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          autosize: true,
          symbol: `NASDAQ:${selectedTicker}`,
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: 'light',
          style: '1',
          locale: 'en',
          enable_publishing: false,
          hide_side_toolbar: true,
          allow_symbol_change: true,
          container_id: 'tradingview_chart_container'
        });
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      initWidget();
    }
  }, [selectedTicker]);

  useEffect(() => {
    const price = STOCK_PRICES[selectedTicker] || 150.00;
    
    const generateOrderBook = () => {
      const generatedBids = [];
      const generatedAsks = [];
      
      for (let i = 1; i <= 5; i++) {
        // Asks are higher than price
        generatedAsks.push({
          price: price + (i * 0.15) + (Math.random() * 0.05 - 0.025),
          size: Math.floor(Math.random() * 350) + 50
        });
        // Bids are lower than price
        generatedBids.push({
          price: price - (i * 0.15) + (Math.random() * 0.05 - 0.025),
          size: Math.floor(Math.random() * 350) + 50
        });
      }
      // Sort asks descending, bids descending
      setAsks(generatedAsks.sort((a, b) => b.price - a.price));
      setBids(generatedBids.sort((a, b) => b.price - a.price));
    };

    generateOrderBook();
    const interval = setInterval(generateOrderBook, 1500);
    return () => clearInterval(interval);
  }, [selectedTicker]);

  // Sync limit price input with ticker base price
  useEffect(() => {
    if (STOCK_PRICES[selectedTicker]) {
      setLimitPrice(Number(STOCK_PRICES[selectedTicker].toFixed(2)));
    }
  }, [selectedTicker]);

  // Order Calculations
  const executionPrice = orderType === 'MARKET' ? (STOCK_PRICES[selectedTicker] || 150) : limitPrice;
  const estimatedTotal = quantity * executionPrice;
  const exchangeFee = 20; // flat exchange levy
  const orderCost = estimatedTotal + (action === 'BUY' ? exchangeFee : -exchangeFee);

  // Handle Trade Execution
  const handleTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity <= 0) {
      triggerToast("Quantity must be greater than 0");
      return;
    }

    const currentHolding = holdings.find(h => h.symbol === selectedTicker);

    if (action === 'BUY') {
      if (orderCost > cashBalance) {
        triggerToast("Insufficient cash balance to complete order.");
        return;
      }
      
      const newCash = cashBalance - orderCost;
      setCashBalance(newCash);
      localStorage.setItem(cashKey, String(newCash));

      if (currentHolding) {
        const totalQty = currentHolding.quantity + quantity;
        const totalCost = (currentHolding.quantity * currentHolding.buyPrice) + (quantity * executionPrice);
        const avgPrice = totalCost / totalQty;
        await updateHolding(currentHolding.id, {
          quantity: totalQty,
          buyPrice: Number(avgPrice.toFixed(2)),
          currentPrice: executionPrice
        });
      } else {
        await addHolding({
          symbol: selectedTicker,
          companyName: `${selectedTicker} Corp`,
          quantity: quantity,
          buyPrice: executionPrice,
          currentPrice: executionPrice,
          purchaseDate: new Date().toISOString().split('T')[0]
        });
      }
    } else {
      // SELL Action
      if (!currentHolding || currentHolding.quantity < quantity) {
        triggerToast(`You do not own enough shares of ${selectedTicker} to sell.`);
        return;
      }

      const newCash = cashBalance + estimatedTotal - exchangeFee;
      setCashBalance(newCash);
      localStorage.setItem(cashKey, String(newCash));

      if (currentHolding.quantity === quantity) {
        await deleteHolding(currentHolding.id);
      } else {
        await updateHolding(currentHolding.id, {
          quantity: currentHolding.quantity - quantity,
          currentPrice: executionPrice
        });
      }
    }

    // Save Trade Record
    const newTrade: TradeRecord = {
      id: `t_${Date.now()}`,
      symbol: selectedTicker,
      action: action,
      qty: quantity,
      price: executionPrice,
      total: estimatedTotal,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 'FILLED'
    };

    const updatedHistory = [newTrade, ...tradeHistory];
    setTradeHistory(updatedHistory);
    localStorage.setItem(tradesKey, JSON.stringify(updatedHistory));

    setExecutedTrade(newTrade);
    triggerToast(`${action} order for ${selectedTicker} filled!`);
  };

  // Mock Link Brokerage
  const handleLinkBroker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !secretKey) {
      triggerToast("Please provide both API Key and Secret Token");
      return;
    }

    setIsLinking(true);
    setTimeout(() => {
      setIsLinking(false);
      setLinkedStatus('linked');
      triggerToast(`Successfully connected to ${broker === 'alpaca' ? 'Alpaca Sandbox' : 'Zerodha Kite API'}!`);
    }, 1500);
  };

  const handleTickerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = searchQuery.trim().toUpperCase();
    if (STOCK_PRICES[cleanQuery]) {
      setSelectedTicker(cleanQuery);
      setSearchQuery('');
    } else {
      triggerToast(`Ticker "${cleanQuery}" is not available.`);
    }
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
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-textPrimary tracking-tight flex items-center gap-2">
              <Zap size={24} className="text-accent" />
              <span>Paper Trading Terminal</span>
            </h2>
            <p className="text-sm text-textSecondary font-medium">
              Interact with real-time stock feeds, view analytical charts, and manage mock trade executions.
            </p>
          </div>

          {/* Cash Balance Display Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-accent text-white py-3 px-5 rounded-xl shadow-md flex items-center gap-3">
            <DollarSign size={24} className="bg-white/10 p-1 rounded-full text-white shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-100/80 tracking-wider">Available Cash</span>
              <p className="text-lg font-black leading-none">{formatCurrency(cashBalance)}</p>
            </div>
          </div>
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

        {/* Main Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT 2 COLUMNS: Charts & Order Book */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Chart Widget Card */}
            <Card className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-accent">
                    {selectedTicker}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-textPrimary leading-none uppercase">{selectedTicker} / USD</h3>
                    <span className="text-[9px] text-textSecondary font-semibold mt-1 inline-block uppercase">Live NASDAQ Data</span>
                  </div>
                </div>

                {/* Ticker Selector buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-[280px] sm:max-w-md py-1 pr-1">
                  {Object.keys(STOCK_PRICES).map(tick => (
                    <button
                      key={tick}
                      onClick={() => setSelectedTicker(tick)}
                      className={`px-2 py-1 text-[10px] font-bold rounded ${
                        selectedTicker === tick
                          ? 'bg-accent text-white shadow-sm'
                          : 'bg-slate-100 text-textSecondary hover:bg-slate-200'
                      }`}
                    >
                      {tick}
                    </button>
                  ))}
                </div>
              </div>

              {/* TradingView Chart Container */}
              <div className="h-[400px] w-full bg-slate-50 border border-borderColor rounded-lg overflow-hidden relative">
                <div id="tradingview_chart_container" className="h-full w-full" />
              </div>
            </Card>

            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={16} className="text-accent animate-pulse" />
                <span>Order Book (Real-time L2 Feed)</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* BIDS (BUY ORDERS - GREEN) */}
                <div className="border border-borderColor rounded-lg overflow-hidden">
                  <div className="bg-emerald-50 text-success font-bold text-[10px] uppercase py-2 px-3 tracking-wider text-left border-b border-borderColor">
                    Bids (Buy Orders)
                  </div>
                  <table className="min-w-full divide-y divide-borderColor/50 text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 text-textSecondary font-bold">
                        <th className="px-3 py-1.5">Bid Price</th>
                        <th className="px-3 py-1.5 text-right">Size (Qty)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borderColor/30">
                      {bids.map((b, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-3 py-1.5 text-success font-bold">₹{b.price.toFixed(2)}</td>
                          <td className="px-3 py-1.5 text-right text-textSecondary font-medium">{b.size}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ASKS (SELL ORDERS - RED) */}
                <div className="border border-borderColor rounded-lg overflow-hidden">
                  <div className="bg-red-50/70 text-danger font-bold text-[10px] uppercase py-2 px-3 tracking-wider text-left border-b border-borderColor">
                    Asks (Sell Orders)
                  </div>
                  <table className="min-w-full divide-y divide-borderColor/50 text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 text-textSecondary font-bold">
                        <th className="px-3 py-1.5">Ask Price</th>
                        <th className="px-3 py-1.5 text-right">Size (Qty)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borderColor/30">
                      {asks.map((a, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-3 py-1.5 text-danger font-bold">₹{a.price.toFixed(2)}</td>
                          <td className="px-3 py-1.5 text-right text-textSecondary font-medium">{a.size}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: Trade Terminal & Broker Connection */}
          <div className="space-y-6">
            
            {/* Trade Terminal Order Entry Panel */}
            <Card className="space-y-4 text-left border border-borderColor">
              <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={16} className="text-accent" />
                <span>Trade Order Panel</span>
              </h3>

              {/* Ticker Search Form */}
              <form onSubmit={handleTickerSearch} className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Ticker (e.g. MSFT)"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 w-full text-xs font-semibold border border-borderColor rounded-lg focus:outline-none focus:border-accent bg-slate-50/50 uppercase"
                  />
                </div>
                <Button type="submit" variant="outline" className="text-xs py-1 px-3">
                  Search
                </Button>
              </form>

              {/* Buy / Sell Toggle Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setAction('BUY')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                    action === 'BUY'
                      ? 'bg-success text-white shadow-sm'
                      : 'text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setAction('SELL')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                    action === 'SELL'
                      ? 'bg-danger text-white shadow-sm'
                      : 'text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  SELL
                </button>
              </div>

              {/* Order form */}
              <form onSubmit={handleTradeSubmit} className="space-y-4">
                
                {/* Order Type */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block">Order Type</label>
                  <div className="flex gap-2">
                    {['MARKET', 'LIMIT'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setOrderType(type as any)}
                        className={`flex-1 py-1 text-xs font-semibold border rounded-lg transition-colors ${
                          orderType === type
                            ? 'border-accent bg-indigo-50 text-accent font-bold'
                            : 'border-borderColor text-textSecondary hover:bg-slate-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity Input */}
                <Input
                  id="trade_qty"
                  type="number"
                  label="Quantity"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  required
                  min={1}
                />

                {/* Limit Price Input (Only for LIMIT order) */}
                <Input
                  id="trade_price"
                  type="number"
                  step="0.01"
                  label={orderType === 'MARKET' ? "Estimated Price (Market)" : "Limit Price (₹)"}
                  value={orderType === 'MARKET' ? STOCK_PRICES[selectedTicker] || 150 : limitPrice}
                  onChange={e => setLimitPrice(Number(e.target.value))}
                  disabled={orderType === 'MARKET'}
                  required
                />

                {/* Summary Costs Panel */}
                <div className="divide-y divide-borderColor/60 text-xs space-y-2 pt-2">
                  <div className="flex justify-between text-textSecondary">
                    <span>Subtotal</span>
                    <span className="font-semibold text-textPrimary">{formatCurrency(estimatedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-textSecondary pt-2">
                    <span>Exchange Levy / Commission</span>
                    <span className="font-semibold text-textPrimary">{formatCurrency(exchangeFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-textPrimary text-sm pt-2">
                    <span>{action === 'BUY' ? 'Estimated Cost' : 'Estimated Credit'}</span>
                    <span className={action === 'BUY' ? 'text-accent' : 'text-success'}>
                      {formatCurrency(estimatedTotal + (action === 'BUY' ? exchangeFee : -exchangeFee))}
                    </span>
                  </div>
                </div>

                {/* Execute Button */}
                <Button
                  type="submit"
                  variant={action === 'BUY' ? 'primary' : 'danger'}
                  fullWidth
                  className="py-3 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1"
                >
                  <Zap size={14} />
                  <span>Execute {action} Order</span>
                </Button>
              </form>
            </Card>

            <Card className="space-y-4 text-left">
              <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={16} className="text-accent" />
                <span>Brokerage API Integration</span>
              </h3>

              {linkedStatus === 'linked' ? (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Check size={18} className="text-success bg-white rounded-full p-0.5 border border-emerald-200" />
                    <span className="text-xs font-bold text-success">Broker Synced Successfully</span>
                  </div>
                  <p className="text-[10px] text-textSecondary leading-normal">
                    Your account is currently linked to <strong>{broker === 'alpaca' ? 'Alpaca Sandbox' : 'Zerodha Kite'}</strong>. Orders will execute through your API credentials.
                  </p>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      setLinkedStatus('unlinked');
                      setApiKey('');
                      setSecretKey('');
                    }}
                    className="text-[10px] py-1 border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50"
                  >
                    Disconnect Broker
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleLinkBroker} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block">Broker API Provider</label>
                    <select
                      value={broker}
                      onChange={e => setBroker(e.target.value as any)}
                      className="w-full text-xs font-semibold py-1.5 px-3 border border-borderColor rounded-lg focus:outline-none focus:border-accent bg-slate-50/50"
                    >
                      <option value="paper">Paper Trading (Internal)</option>
                      <option value="alpaca">Alpaca API (Paper Sandbox)</option>
                      <option value="zerodha">Zerodha Kite (Web API)</option>
                    </select>
                  </div>

                  {broker !== 'paper' && (
                    <>
                      <Input
                        id="broker_api_key"
                        placeholder="e.g. PK839A20LSK"
                        label="API Key ID"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        required
                      />
                      <Input
                        id="broker_secret_key"
                        type="password"
                        placeholder="e.g. ••••••••••••••••"
                        label="Secret Access Token"
                        value={secretKey}
                        onChange={e => setSecretKey(e.target.value)}
                        required
                      />
                    </>
                  )}

                  <Button
                    type="submit"
                    variant="outline"
                    fullWidth
                    disabled={isLinking}
                    className="text-xs font-bold flex items-center justify-center gap-1"
                  >
                    {isLinking ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={14} />
                        <span>{broker === 'paper' ? 'Start paper trade session' : 'Connect Broker API'}</span>
                      </>
                    )}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>

        {/* Trade Executed Log Table */}
        <Card className="p-0 overflow-hidden text-left">
          <div className="px-6 py-4 border-b border-borderColor bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">Order Executions Log</h3>
            <button
              onClick={() => {
                setTradeHistory([]);
                localStorage.removeItem(tradesKey);
                triggerToast("Cleared trade log.");
              }}
              className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-md transition-colors"
            >
              Clear Log
            </button>
          </div>
          
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-borderColor">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary uppercase">Ticker</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary uppercase">Action</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-textSecondary uppercase">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-textSecondary uppercase">Execution Price</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-textSecondary uppercase">Total Cost</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-textSecondary uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-textSecondary uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderColor bg-white text-xs">
                {tradeHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-textSecondary font-semibold">
                      No trades executed in this session yet. Place a buy or sell order above!
                    </td>
                  </tr>
                ) : (
                  tradeHistory.map(trade => (
                    <tr key={trade.id} className="hover:bg-slate-50/30">
                      <td className="px-6 py-3 font-bold text-textPrimary">{trade.symbol}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                          trade.action === 'BUY' 
                            ? 'bg-emerald-50 text-success' 
                            : 'bg-red-50 text-danger'
                        }`}>
                          {trade.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-textSecondary">{trade.qty}</td>
                      <td className="px-6 py-3 text-right font-semibold text-textPrimary">₹{trade.price.toFixed(2)}</td>
                      <td className="px-6 py-3 text-right font-extrabold text-textPrimary">₹{trade.total.toFixed(2)}</td>
                      <td className="px-6 py-3 text-center text-textSecondary font-medium">{trade.time}</td>
                      <td className="px-6 py-3 text-center">
                        <span className="bg-blue-50 text-accent font-bold px-1.5 py-0.5 rounded text-[9px]">
                          {trade.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* TRADE CONFIRMATION MODAL RECEIPT */}
      <Modal
        isOpen={executedTrade !== null}
        onClose={() => setExecutedTrade(null)}
        title="Transaction Receipt"
      >
        {executedTrade && (
          <div className="flex flex-col items-center py-4 text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="text-success"
            >
              <Check size={56} className="bg-emerald-50 border border-emerald-100 rounded-full p-2.5 h-16 w-16" />
            </motion.div>
            
            <div className="space-y-1">
              <h4 className="text-base font-black text-textPrimary">Trade Executed Successfully!</h4>
              <p className="text-[10px] text-textSecondary font-medium">Order filled on Paper Trading Server</p>
            </div>

            {/* Receipt Summary Grid */}
            <div className="w-full bg-slate-50 border border-borderColor rounded-xl p-4 text-xs divide-y divide-borderColor/60 space-y-2">
              <div className="flex justify-between pb-2 font-medium">
                <span className="text-textSecondary">Ticker Symbol</span>
                <span className="font-bold text-textPrimary">{executedTrade.symbol}</span>
              </div>
              <div className="flex justify-between py-2 font-medium">
                <span className="text-textSecondary">Order Type / Action</span>
                <span className={`font-bold ${executedTrade.action === 'BUY' ? 'text-accent' : 'text-danger'}`}>
                  {executedTrade.action === 'BUY' ? 'BUY (Market)' : 'SELL (Market)'}
                </span>
              </div>
              <div className="flex justify-between py-2 font-medium">
                <span className="text-textSecondary">Executed Quantity</span>
                <span className="font-bold text-textPrimary">{executedTrade.qty} shares</span>
              </div>
              <div className="flex justify-between py-2 font-medium">
                <span className="text-textSecondary">Execution Price</span>
                <span className="font-bold text-textPrimary">₹{executedTrade.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 font-bold text-textPrimary text-sm">
                <span>Total Settled Cost</span>
                <span>₹{executedTrade.total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              variant="outline"
              fullWidth
              onClick={() => setExecutedTrade(null)}
              className="mt-2 text-xs font-bold"
            >
              Got it, thanks!
            </Button>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default Trading;
