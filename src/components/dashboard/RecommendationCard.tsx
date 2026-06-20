import React from 'react';
import { motion } from 'framer-motion';
import type { Recommendation } from '../../types';
import { Badge } from '../ui/Badge';
import { ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation, index }) => {
  const { type, message, priority } = recommendation;

  // Border and icon config based on type
  const typeConfigs = {
    rebalance: {
      borderColor: 'border-l-indigo-500',
      icon: <RefreshCw className="text-indigo-500" size={16} />,
      bg: 'bg-indigo-50/30'
    },
    buy: {
      borderColor: 'border-l-emerald-500',
      icon: <ArrowUpRight className="text-emerald-500" size={16} />,
      bg: 'bg-emerald-50/30'
    },
    sell: {
      borderColor: 'border-l-red-500',
      icon: <ArrowDownRight className="text-red-500" size={16} />,
      bg: 'bg-red-50/30'
    },
    hold: {
      borderColor: 'border-l-amber-500',
      icon: <AlertCircle className="text-amber-500" size={16} />,
      bg: 'bg-amber-50/30'
    }
  };

  const priorityConfigs = {
    high: 'danger' as const,
    medium: 'warning' as const,
    low: 'info' as const
  };

  const config = typeConfigs[type] || typeConfigs.hold;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.35, ease: "easeOut" }}
      whileHover={{ x: 4 }}
      className={`border-l-4 ${config.borderColor} ${config.bg} p-4 rounded-r-xl border border-borderColor border-l-0 bg-white shadow-sm flex items-start gap-3 transition-all duration-200`}
    >
      <div className="p-1.5 bg-white rounded-md border border-borderColor shadow-sm flex items-center justify-center shrink-0">
        {config.icon}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold capitalize text-textPrimary">
            {type} Alert
          </span>
          <Badge variant={priorityConfigs[priority]}>
            {priority}
          </Badge>
        </div>
        <p className="text-xs text-textSecondary leading-relaxed">
          {message}
        </p>
      </div>
    </motion.div>
  );
};
export default RecommendationCard;
