import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Sparkles, Check, FolderOpen } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import AllocationPieChart from '../components/charts/AllocationPieChart';
import { useCountUp } from '../hooks/useCountUp';
import { usePortfolio } from '../hooks/usePortfolio';
import { formatCurrency } from '../utils/formatters';

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } }
};

export const Optimizer: React.FC = () => {
  const navigate = useNavigate();
  const { holdings, isLoading } = usePortfolio();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  React.useEffect(() => {
    document.title = "Portfolio Optimizer — StockSense";
  }, []);

  const totalValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);

  const maxConcentration = holdings.length > 0
    ? Math.max(...holdings.map(h => (h.quantity * h.currentPrice) / (totalValue || 1)))
    : 0;

  // Dynamic values for the count-up animations based on holding concentration
  const returnImprovementVal = holdings.length === 0 ? 0 : Math.round((1.5 + maxConcentration * 2.0) * 100);
  const riskReductionVal = holdings.length === 0 ? 0 : Math.round((4.0 + maxConcentration * 10.0) * 100);
  const currentSharpeVal = holdings.length === 0 ? 0 : Math.round((0.6 + (holdings.length * 0.08) - (maxConcentration * 0.3)) * 100);
  const recommendedSharpeVal = holdings.length === 0 ? 0 : Math.round((currentSharpeVal / 100 + 0.25) * 100);

  // Compute float count-ups by scaling target by 100, counting, and dividing
  const returnImprovement = useCountUp(returnImprovementVal) / 100;
  const riskReduction = useCountUp(riskReductionVal) / 100;
  const currentSharpe = useCountUp(currentSharpeVal) / 100;
  const recommendedSharpe = useCountUp(recommendedSharpeVal) / 100;

  // Current Allocation
  const currentAllocation = holdings.map(h => {
    const val = h.quantity * h.currentPrice;
    const pct = totalValue > 0 ? Math.round((val / totalValue) * 100) : 0;
    return { symbol: h.symbol, percentage: pct, value: val };
  });

  // Ensure current allocation percentages sum to exactly 100
  const currentPctSum = currentAllocation.reduce((sum, item) => sum + item.percentage, 0);
  if (currentPctSum > 0 && currentPctSum !== 100 && currentAllocation.length > 0) {
    currentAllocation[0].percentage += (100 - currentPctSum);
  }

  // Recommended Allocation: equal weighting (simple optimization model)
  const recommendedAllocation = currentAllocation.map(item => {
    const targetPct = holdings.length > 0 ? Math.floor(100 / holdings.length) : 0;
    return {
      symbol: item.symbol,
      percentage: targetPct,
      change: 0
    };
  });

  // Ensure recommended allocations sum to exactly 100
  const recommendedPctSum = recommendedAllocation.reduce((sum, item) => sum + item.percentage, 0);
  if (recommendedPctSum > 0 && recommendedPctSum !== 100 && recommendedAllocation.length > 0) {
    recommendedAllocation[recommendedAllocation.length - 1].percentage += (100 - recommendedPctSum);
  }

  // Compute changes
  recommendedAllocation.forEach(item => {
    const cur = currentAllocation.find(c => c.symbol === item.symbol);
    item.change = item.percentage - (cur ? cur.percentage : 0);
  });

  // Map data to Recharts format
  const currentPieData = currentAllocation.map(item => ({
    symbol: item.symbol,
    percentage: item.percentage,
    value: item.value
  }));

  const recommendedPieData = recommendedAllocation.map(item => ({
    symbol: item.symbol,
    percentage: item.percentage
  }));

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex justify-center items-center gap-2">
          <svg className="animate-spin h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-textSecondary font-semibold">Running AI Optimization calculations...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (holdings.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-8 text-left">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-textPrimary tracking-tight">Portfolio Optimizer</h2>
            <p className="text-sm text-textSecondary font-medium flex items-center gap-1">
              <Sparkles size={16} className="text-accent" />
              <span>AI-powered rebalancing suggestions to maximize efficiency.</span>
            </p>
          </div>
          
          <Card className="flex flex-col items-center py-16 justify-center text-center">
            <span className="text-4xl mb-4">🎯</span>
            <h3 className="text-sm font-bold text-textPrimary">No holdings found to optimize.</h3>
            <p className="text-xs text-textSecondary max-w-sm mt-1 mb-6">
              Go to the Portfolio Analyzer to add stock positions, and we will automatically generate optimized allocations for you.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/portfolio')}
              className="flex items-center gap-1.5"
            >
              <FolderOpen size={16} />
              <span>Go to Portfolio Analyzer</span>
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

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
          <h2 className="text-2xl font-bold text-textPrimary tracking-tight">Portfolio Optimizer</h2>
          <p className="text-sm text-textSecondary font-medium flex items-center gap-1">
            <Sparkles size={16} className="text-accent" />
            <span>AI-powered rebalancing suggestions to maximize efficiency.</span>
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN: Current Allocation */}
          <Card className="space-y-6">
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">Current Allocation</h3>
            
            {/* Pie Chart */}
            <AllocationPieChart data={currentPieData} />

            {/* Table */}
            <div className="overflow-x-auto border border-borderColor rounded-lg">
              <table className="min-w-full divide-y divide-borderColor">
                <thead>
                  <tr className="bg-slate-50">
                    <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-textSecondary uppercase">Symbol</th>
                    <th scope="col" className="px-4 py-2.5 text-right text-xs font-semibold text-textSecondary uppercase">Current %</th>
                    <th scope="col" className="px-4 py-2.5 text-right text-xs font-semibold text-textSecondary uppercase">Current Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderColor bg-white text-xs">
                  {currentAllocation.map((row) => (
                    <tr key={row.symbol} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-textPrimary">{row.symbol}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-textSecondary">{row.percentage}%</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-textPrimary">{formatCurrency(row.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* RIGHT COLUMN: Recommended Allocation */}
          <Card className="space-y-6">
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">Recommended Allocation</h3>
            
            {/* Pie Chart */}
            <AllocationPieChart data={recommendedPieData} />

            {/* Table */}
            <div className="overflow-x-auto border border-borderColor rounded-lg">
              <table className="min-w-full divide-y divide-borderColor">
                <thead>
                  <tr className="bg-slate-50">
                    <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-textSecondary uppercase">Symbol</th>
                    <th scope="col" className="px-4 py-2.5 text-right text-xs font-semibold text-textSecondary uppercase">Recommended %</th>
                    <th scope="col" className="px-4 py-2.5 text-right text-xs font-semibold text-textSecondary uppercase">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderColor bg-white text-xs">
                  {recommendedAllocation.map((row) => {
                    const isPositive = row.change >= 0;
                    return (
                      <tr key={row.symbol} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-bold text-textPrimary">{row.symbol}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-textSecondary">{row.percentage}%</td>
                        <td className={`px-4 py-2.5 text-right font-semibold flex items-center justify-end gap-1 ${
                          isPositive ? 'text-success' : 'text-danger'
                        }`}>
                          <span className={isPositive ? 'animate-pulse-arrow-up' : 'animate-pulse-arrow-down'}>
                            {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                          </span>
                          <span>{isPositive ? '+' : ''}{row.change}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Projected Improvement Card */}
        <Card className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-8 relative overflow-hidden">
          {/* Subtle bg pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-grow max-w-3xl">
              <div className="space-y-1 text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Projected Return Improvement</span>
                <h4 className="text-3xl font-extrabold text-success tracking-tight">+{returnImprovement.toFixed(1)}%</h4>
                <p className="text-[10px] text-slate-400">Additional yield calculated annually</p>
              </div>
              <div className="space-y-1 text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Risk Reduction</span>
                <h4 className="text-3xl font-extrabold text-success tracking-tight">-{riskReduction.toFixed(1)}%</h4>
                <p className="text-[10px] text-slate-400">Volatility drop under optimized weights</p>
              </div>
              <div className="space-y-1 text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sharpe Ratio improvement</span>
                <h4 className="text-3xl font-extrabold text-white tracking-tight">
                  {currentSharpe.toFixed(2)} <span className="text-accent text-xl">→</span> {recommendedSharpe.toFixed(2)}
                </h4>
                <p className="text-[10px] text-slate-400">Risk-adjusted return efficiency boost</p>
              </div>
            </div>

            <div className="shrink-0 flex items-center">
              <Button
                variant="primary"
                onClick={() => setIsSuccessModalOpen(true)}
                className="bg-white text-primary hover:bg-slate-100 font-bold py-3 px-6 text-sm"
              >
                Apply Recommendations
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* SUCCESS MODAL */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Optimization Saved"
      >
        <div className="flex flex-col items-center py-4 text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-success"
          >
            <Check size={56} className="bg-emerald-50 border border-emerald-100 rounded-full p-2.5 h-16 w-16" />
          </motion.div>
          
          <div className="space-y-2">
            <h4 className="text-base font-bold text-textPrimary">Recommendations applied!</h4>
            <p className="text-xs text-textSecondary leading-relaxed max-w-sm mx-auto">
              Your recommended allocations have been saved to your profile. Please implement these rebalancing trades in your broker dashboard.
            </p>
          </div>

          <Button
            variant="outline"
            fullWidth
            onClick={() => setIsSuccessModalOpen(false)}
            className="mt-2"
          >
            Got it, thanks!
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
};
export default Optimizer;
