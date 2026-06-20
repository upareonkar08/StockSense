import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Award, TrendingUp } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useCountUp } from '../hooks/useCountUp';
import { usePortfolio } from '../hooks/usePortfolio';
import { getSectorData, getDynamicHealthScore } from '../utils/portfolioMath';

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } }
};

export const PortfolioHealth: React.FC = () => {
  const { holdings } = usePortfolio();
  
  React.useEffect(() => {
    document.title = "Portfolio Health — StockSense";
  }, []);

  const healthScore = getDynamicHealthScore(holdings);
  const sectors = getSectorData(holdings);
  
  // Custom count up specifically for 2 seconds (2000ms duration)
  const animatedScore = useCountUp(healthScore, 2000);

  // Determine badge styling based on score
  const getScoreRating = (score: number) => {
    if (score >= 70) return { label: 'Good', variant: 'success' as const, color: 'text-success' };
    if (score >= 40) return { label: 'Fair', variant: 'warning' as const, color: 'text-warning' };
    return { label: 'Poor', variant: 'danger' as const, color: 'text-danger' };
  };

  const scoreRating = getScoreRating(healthScore);

  // SVG parameters for the ring
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius; // Approx 314.16

  // Sector colors map
  const sectorColors = [
    'bg-indigo-500',
    'bg-emerald-500',
    'bg-blue-500',
    'bg-amber-500',
    'bg-red-500',
    'bg-slate-500'
  ];

  // Dynamic factor calculations
  const totalValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
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
    
  const divRating = holdings.length === 0
    ? "N/A"
    : holdings.length <= 2
    ? "Poor"
    : holdings.length <= 4
    ? "Fair"
    : "Good";
    
  const volatilityVal = holdings.length === 0
    ? "0.0%"
    : `${(10.2 + maxConcentration * 15).toFixed(1)}%`;

  const factors = [
    { name: "Diversification", score: holdings.length === 0 ? 0 : Math.min(100, holdings.length * 20), color: "bg-success" },
    { name: "Risk Management", score: holdings.length === 0 ? 0 : Math.round(100 * (1 - maxConcentration)), color: "bg-warning" },
    { name: "Return Performance", score: holdings.length === 0 ? 0 : Math.round(healthScore * 1.02), color: "bg-success" },
    { name: "Sector Balance", score: holdings.length === 0 ? 0 : Math.max(10, Math.round(100 * (1 - (sectors[0]?.percentage / 100 || 0)))), color: "bg-warning" }
  ];

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
          <h2 className="text-2xl font-bold text-textPrimary tracking-tight">Portfolio Health</h2>
          <p className="text-sm text-textSecondary font-medium">Get diagnostic AI reports on diversification, performance, and risk metrics.</p>
        </div>

        {/* Top: Animated circular health score */}
        <Card className="flex flex-col items-center py-8 justify-center text-center relative overflow-hidden">
          <div className="relative h-36 w-36 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="absolute inset-0 transform -rotate-95 w-full h-full" viewBox="0 0 120 120">
              {/* Underlay grey ring */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="stroke-slate-100"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Animated overlay color ring */}
              <motion.circle
                cx="60"
                cy="60"
                r={radius}
                className={
                  healthScore >= 70
                    ? 'stroke-success'
                    : healthScore >= 40
                    ? 'stroke-warning'
                    : 'stroke-danger'
                }
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference * (1 - healthScore / 100) }}
                transition={{ duration: 2, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Number */}
            <div className="flex flex-col items-center">
              <span className="text-4xl font-extrabold text-textPrimary tracking-tight">
                {animatedScore}
              </span>
              <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mt-0.5">
                Score
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <Badge variant={scoreRating.variant}>{scoreRating.label}</Badge>
            <p className="text-xs text-textSecondary font-medium max-w-sm mt-1">
              {healthScore >= 70 
                ? `Your portfolio is in good health with an overall diagnostic score of ${healthScore}/100.` 
                : healthScore >= 40 
                ? `Your portfolio is in fair health with a diagnostic score of ${healthScore}/100. Optimization is recommended.` 
                : `Your portfolio health score is low (${healthScore}/100). Please review and optimize your allocations.`}
            </p>
          </div>
        </Card>

        {/* 3 Metric Cards (Stagger Entrance) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              title: "Risk Level",
              value: riskScore,
              badge: <Badge variant={riskScore === "High" ? "danger" : riskScore === "Medium" ? "warning" : "success"}>{riskScore}</Badge>,
              sub: riskScore === "High" ? "⚠️ Trim concentrated positions" : riskScore === "Medium" ? "⚠️ Review sector weights" : "✅ Low risk concentration",
              icon: <ShieldAlert className={riskScore === "High" ? "text-danger" : riskScore === "Medium" ? "text-warning" : "text-success"} size={18} />,
              bg: riskScore === "High" ? "bg-red-50/50" : riskScore === "Medium" ? "bg-amber-50/50" : "bg-emerald-50/50"
            },
            {
              title: "Diversification",
              value: divRating,
              badge: <Badge variant={divRating === "Good" ? "success" : divRating === "Fair" ? "warning" : "danger"}>{divRating}</Badge>,
              sub: holdings.length === 0 ? "No positions added" : `✅ Spread across ${sectors.length} sectors`,
              icon: <Award className={divRating === "Good" ? "text-success" : divRating === "Fair" ? "text-warning" : "text-danger"} size={18} />,
              bg: divRating === "Good" ? "bg-emerald-50/50" : divRating === "Fair" ? "bg-amber-50/50" : "bg-red-50/50"
            },
            {
              title: "Volatility",
              value: volatilityVal,
              badge: <Badge variant={volatilityVal === "0.0%" ? "danger" : "info"}>{volatilityVal}</Badge>,
              sub: "Annualized volatility",
              icon: <TrendingUp className="text-blue-500" size={18} />,
              bg: "bg-blue-50/50"
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <Card hoverEffect className="flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-textSecondary uppercase tracking-wider">{item.title}</span>
                  <div className={`p-1.5 rounded ${item.bg}`}>
                    {item.icon}
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-textPrimary">{item.value}</h4>
                  <p className="text-xs text-textSecondary font-medium">{item.sub}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Sector Exposure & Health Factors Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sector Exposure */}
          <Card className="space-y-6">
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">Sector Exposure</h3>
            <div className="space-y-4">
              {sectors.length === 0 ? (
                <div className="text-xs text-textSecondary font-semibold text-center py-8">
                  No holdings found. Add stocks in Analyzer.
                </div>
              ) : (
                sectors.map((item, index) => (
                  <div key={item.sector} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-textPrimary font-semibold">
                      <span>{item.sector}</span>
                      <span>{item.percentage}%</span>
                    </div>
                    {/* Custom progress bar that animates fill width */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ delay: index * 0.1, duration: 0.8, ease: "easeOut" }}
                        className={`h-full ${sectorColors[index % sectorColors.length]}`}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Health Breakdown */}
          <Card className="space-y-6">
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">What's Affecting Your Score</h3>
            <div className="space-y-4">
              {factors.map((factor) => (
                <div key={factor.name} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-textPrimary font-semibold">
                    <span>{factor.name}</span>
                    <span>{factor.score}/100</span>
                  </div>
                  {/* progress fill */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${factor.score}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className={`h-full ${factor.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recommendations List */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { text: "High tech concentration (45%). Reduce to under 30% for better balance.", border: "border-l-red-500 bg-red-50/20", bullet: "🔴" },
              { text: "Good diversification across market caps.", border: "border-l-emerald-500 bg-emerald-50/20", bullet: "🟢" },
              { text: "Add 1-2 dividend stocks to improve income stability.", border: "border-l-amber-500 bg-amber-50/20", bullet: "🟡" },
              { text: "Consider international ETFs for geographic diversification.", border: "border-l-blue-500 bg-blue-50/20", bullet: "🔵" }
            ].map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
                whileHover={{ x: 4 }}
                className={`border-l-4 ${rec.border} p-4 rounded-r-xl border border-borderColor border-l-0 flex items-start gap-2.5 transition-all duration-200`}
              >
                <span className="shrink-0 text-sm mt-0.5">{rec.bullet}</span>
                <p className="text-xs text-textPrimary leading-relaxed font-medium">{rec.text}</p>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};
export default PortfolioHealth;
