import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Heart, AlertTriangle, TrendingUp, ArrowUpRight } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import PortfolioGrowthChart from '../components/charts/PortfolioGrowthChart';
import AllocationPieChart from '../components/charts/AllocationPieChart';
import HoldingsTable from '../components/dashboard/HoldingsTable';
import RecommendationCard from '../components/dashboard/RecommendationCard';
import { useAuth } from '../hooks/useAuth';
import { usePortfolio } from '../hooks/usePortfolio';
import {
  portfolioGrowthData,
  dummyRecommendations
} from '../data/dummyData';
import { getGreeting } from '../utils/formatters';
import { getSectorData, getDynamicHealthScore } from '../utils/portfolioMath';

// Mock values for date filters
const mockPerformanceData = {
  '1M': [
    { month: "May 15", value: 110000 },
    { month: "May 22", value: 115000 },
    { month: "May 29", value: 113000 },
    { month: "Jun 05", value: 119000 },
    { month: "Jun 12", value: 124350 }
  ],
  '3M': [
    { month: "Mar", value: 102000 },
    { month: "Apr", value: 99000 },
    { month: "May", value: 110000 },
    { month: "Jun", value: 124350 }
  ],
  '6M': portfolioGrowthData,
  '1Y': [
    { month: "Jul 23", value: 85000 },
    { month: "Sep 23", value: 91000 },
    { month: "Nov 23", value: 94000 },
    { month: "Jan 24", value: 95000 },
    { month: "Mar 24", value: 102000 },
    { month: "May 24", value: 110000 },
    { month: "Jun 24", value: 124350 }
  ]
};

type DateRange = '1M' | '3M' | '6M' | '1Y';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { holdings } = usePortfolio();
  const [dateRange, setDateRange] = useState<DateRange>('6M');

  React.useEffect(() => {
    document.title = "Dashboard — StockSense";
  }, []);

  const greeting = getGreeting();
  const firstName = user?.name.split(' ')[0] || 'User';

  // Compute dynamic stats
  const totalValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.quantity * h.buyPrice, 0);
  const totalPnL = totalValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  
  const healthScore = getDynamicHealthScore(holdings);
  const sectors = getSectorData(holdings);

  // Heuristic for risk rating
  const maxConcentration = holdings.length > 0
    ? Math.max(...holdings.map(h => (h.quantity * h.currentPrice) / (totalValue || 1)))
    : 0;
  const riskScore = holdings.length === 0
    ? "N/A"
    : maxConcentration > 0.6 || holdings.length <= 1
    ? "High"
    : maxConcentration > 0.35
    ? "Medium"
    : "Low";

  return (
    <DashboardLayout>
      <div className="space-y-8 text-left">
        {/* Header Greeting */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-textPrimary tracking-tight">
            {greeting}, {firstName} 👋
          </h2>
          <p className="text-sm text-textSecondary font-medium">
            Here's how your portfolio is performing today.
          </p>
        </div>

        {/* Row 1: Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            index={0}
            title="Portfolio Value"
            value={totalValue}
            isCurrency
            icon={<DollarSign size={20} />}
            iconBgColor="bg-indigo-50 text-accent"
            subtext={
              <span className="text-success flex items-center gap-0.5">
                <span>▲</span> 2.4% today
              </span>
            }
          />
          <StatCard
            index={1}
            title="Health Score"
            value={healthScore}
            isRatio
            icon={<Heart size={20} />}
            iconBgColor="bg-emerald-50 text-success"
            subtext={
              <span className={`flex items-center gap-0.5 ${healthScore >= 70 ? 'text-success' : (healthScore >= 40 ? 'text-warning' : 'text-danger')}`}>
                <span>{healthScore >= 50 ? '▲' : '▼'}</span> {healthScore >= 70 ? 'Healthy allocation' : 'Optimization needed'}
              </span>
            }
          />
          <StatCard
            index={2}
            title="Risk Score"
            value={riskScore}
            icon={<AlertTriangle size={20} />}
            iconBgColor={riskScore === "High" ? "bg-red-50 text-danger" : (riskScore === "Medium" ? "bg-amber-50 text-warning" : "bg-emerald-50 text-success")}
            subtext={
              <span className={riskScore === "High" ? "text-danger" : (riskScore === "Medium" ? "text-warning" : "text-success")}>
                {riskScore === "High" ? "⚠️ Trim concentrated positions" : (riskScore === "Medium" ? "⚠️ Review allocations" : "✅ Well-balanced portfolio")}
              </span>
            }
          />
          <StatCard
            index={3}
            title="Total P&L"
            value={totalPnL}
            isCurrency
            icon={<TrendingUp size={20} />}
            iconBgColor={totalPnL >= 0 ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"}
            subtext={
              <span className={`flex items-center gap-0.5 ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                <span>{totalPnL >= 0 ? '▲' : '▼'}</span> {totalPnL >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}% overall
              </span>
            }
          />
        </div>

        {/* Row 2: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Chart (65%) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-borderColor p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">
                Portfolio Performance
              </h3>
              
              {/* Date Filters */}
              <div className="flex bg-slate-50 border border-borderColor p-1 rounded-lg">
                {(['1M', '3M', '6M', '1Y'] as DateRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      dateRange === range
                        ? 'bg-white text-accent shadow-sm border border-borderColor/50'
                        : 'text-textSecondary hover:text-textPrimary'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <PortfolioGrowthChart data={mockPerformanceData[dateRange]} />
          </div>

          {/* Right Allocation Chart (35%) */}
          <div className="bg-white rounded-xl border border-borderColor p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider mb-6">
              Current Allocation
            </h3>
            {sectors.length > 0 ? (
              <AllocationPieChart data={sectors} />
            ) : (
              <div className="flex-grow flex items-center justify-center text-xs text-textSecondary font-semibold">
                No holdings found. Go to Portfolio Analyzer to add stocks.
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Holdings & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Holdings Table (60%) */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-borderColor p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">
                Top Holdings
              </h3>
              <Link
                to="/portfolio"
                className="text-xs font-bold text-accent hover:text-indigo-600 flex items-center gap-0.5"
              >
                <span>View All</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="flex-grow">
              <HoldingsTable holdings={holdings} limit={5} />
            </div>
          </div>

          {/* AI Recommendations (40%) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-borderColor p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider mb-4">
              AI Recommendations
            </h3>
            <div className="space-y-3 flex-grow overflow-y-auto max-h-[300px] pr-1">
              {dummyRecommendations.map((rec, index) => (
                <RecommendationCard key={rec.id} recommendation={rec} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default Dashboard;
