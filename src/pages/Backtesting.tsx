import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, Award, ShieldAlert, BarChart3, Landmark } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import BenchmarkChart from '../components/charts/BenchmarkChart';
import DrawdownChart from '../components/charts/DrawdownChart';
import { dummyBacktestResult } from '../data/dummyData';
import { formatPercent } from '../utils/formatters';

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } }
};

export const Backtesting: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [benchmark, setBenchmark] = useState('S&P 500');
  
  // Loading states
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(true); // Default to showing results on first load

  React.useEffect(() => {
    document.title = "Backtesting Engine — StockSense";
  }, []);

  const handleRunBacktest = () => {
    setIsRunning(true);
    setShowResults(false);
    
    // Simulate 1.5s run time
    setTimeout(() => {
      setIsRunning(false);
      setShowResults(true);
    }, 1500);
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
        {/* Header Title */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-textPrimary tracking-tight">Backtesting Engine</h2>
          <p className="text-sm text-textSecondary font-medium">Test your asset allocation strategy against historical market data cycles.</p>
        </div>

        {/* Controls Bar */}
        <Card className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1 text-xs font-semibold">
            <label htmlFor="start-date" className="block text-textSecondary uppercase tracking-wider">Start Date</label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full rounded-lg border border-borderColor bg-white py-2 px-3 text-textPrimary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
          <div className="space-y-1 text-xs font-semibold">
            <label htmlFor="end-date" className="block text-textSecondary uppercase tracking-wider">End Date</label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full rounded-lg border border-borderColor bg-white py-2 px-3 text-textPrimary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
          <div className="space-y-1 text-xs font-semibold">
            <label htmlFor="benchmark-select" className="block text-textSecondary uppercase tracking-wider">Benchmark</label>
            <select
              id="benchmark-select"
              value={benchmark}
              onChange={(e) => setBenchmark(e.target.value)}
              className="block w-full rounded-lg border border-borderColor bg-white py-2 px-3 text-textPrimary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            >
              <option value="S&P 500">S&P 500</option>
              <option value="NIFTY 50">NIFTY 50</option>
              <option value="NASDAQ">NASDAQ</option>
            </select>
          </div>
          <Button
            onClick={handleRunBacktest}
            variant="primary"
            fullWidth
            className="flex items-center gap-2 py-2.5"
            disabled={isRunning}
          >
            <PlayCircle size={16} />
            <span>Run Backtest</span>
          </Button>
        </Card>

        {/* Loader Overlay (1.5 seconds) */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-xl border border-borderColor p-12 text-center flex flex-col items-center justify-center space-y-5"
            >
              <Landmark size={40} className="text-accent animate-pulse" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-textPrimary">Analyzing your portfolio performance...</h4>
                <p className="text-xs text-textSecondary">Simulating historical returns and calculating volatility curves.</p>
              </div>
              {/* Progress bar filling over 1.5s */}
              <div className="h-1.5 w-full max-w-xs bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, ease: "linear" }}
                  className="h-full bg-accent"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Area */}
        <AnimatePresence>
          {showResults && !isRunning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              {/* Row 1: Staggered Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  {
                    label: "Total Return",
                    value: `+${dummyBacktestResult.totalReturn}%`,
                    sub: `vs ${benchmark}: +36.2%`,
                    icon: <Award className="text-success" size={18} />,
                    color: "text-success",
                    bg: "bg-emerald-50/50"
                  },
                  {
                    label: "CAGR",
                    value: `${dummyBacktestResult.cagr}%`,
                    sub: "Compound annual growth rate",
                    icon: <BarChart3 className="text-accent" size={18} />,
                    color: "text-textPrimary",
                    bg: "bg-indigo-50/50"
                  },
                  {
                    label: "Max Drawdown",
                    value: `${dummyBacktestResult.maxDrawdown}%`,
                    sub: "Worst peak-to-trough drop",
                    icon: <ShieldAlert className="text-danger" size={18} />,
                    color: "text-danger",
                    bg: "bg-red-50/50"
                  },
                  {
                    label: "Sharpe Ratio",
                    value: `${dummyBacktestResult.sharpeRatio}`,
                    sub: "Risk-adjusted performance",
                    icon: <Landmark className="text-blue-500" size={18} />,
                    color: "text-textPrimary",
                    bg: "bg-blue-50/50"
                  }
                ].map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.35 }}
                  >
                    <Card hoverEffect className="flex flex-col justify-between h-full">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-textSecondary uppercase tracking-wider">{stat.label}</span>
                        <div className={`p-1.5 rounded ${stat.bg}`}>{stat.icon}</div>
                      </div>
                      <div className="space-y-1">
                        <h4 className={`text-xl font-bold ${stat.color}`}>{stat.value}</h4>
                        <p className="text-xs text-textSecondary font-medium">{stat.sub}</p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Chart 1: Performance Compare */}
              <Card className="space-y-6">
                <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">
                  Portfolio Growth vs {benchmark}
                </h3>
                <BenchmarkChart data={dummyBacktestResult.chartData} benchmarkName={benchmark} />
              </Card>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 2: Monthly Returns */}
                <Card className="space-y-6">
                  <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">
                    Monthly Returns
                  </h3>
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dummyBacktestResult.monthlyReturns}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748B', fontSize: 10 }}
                          dy={6}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748B', fontSize: 10 }}
                          tickFormatter={(value) => `${value}%`}
                          dx={-6}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0].payload;
                              return (
                                <div className="bg-white border border-borderColor p-2 rounded shadow-md text-left text-xs">
                                  <p className="font-semibold text-textSecondary">{item.month}</p>
                                  <p className={`font-bold mt-0.5 ${item.return >= 0 ? 'text-success' : 'text-danger'}`}>
                                    Return: {formatPercent(item.return)}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="return" animationDuration={1200} radius={[4, 4, 0, 0]}>
                          {dummyBacktestResult.monthlyReturns.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.return >= 0 ? '#10B981' : '#EF4444'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Chart 3: Drawdown Analysis */}
                <Card className="space-y-6">
                  <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">
                    Drawdown Analysis
                  </h3>
                  <DrawdownChart data={dummyBacktestResult.chartData} />
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
};
export default Backtesting;
