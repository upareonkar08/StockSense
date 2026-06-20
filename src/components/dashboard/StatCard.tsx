import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { useCountUp } from '../../hooks/useCountUp';
import { formatCurrency } from '../../utils/formatters';

interface StatCardProps {
  title: string;
  value: number | string;
  subtext: React.ReactNode;
  icon: React.ReactNode;
  iconBgColor?: string;
  index: number;
  isCurrency?: boolean;
  isRatio?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon,
  iconBgColor = 'bg-indigo-50 text-accent',
  index,
  isCurrency = false,
  isRatio = false
}) => {
  const isNumericValue = typeof value === 'number';
  const animatedValue = useCountUp(isNumericValue ? (value as number) : 0);

  const displayValue = () => {
    if (!isNumericValue) return value;
    if (isCurrency) return formatCurrency(animatedValue);
    if (isRatio) return `${animatedValue}/100`;
    return animatedValue.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card hoverEffect className="flex flex-col justify-between h-full">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-textSecondary uppercase tracking-wider">
              {title}
            </span>
            <h4 className="text-2xl font-bold text-textPrimary tracking-tight">
              {displayValue()}
            </h4>
          </div>
          <div className={`p-2.5 rounded-lg flex items-center justify-center ${iconBgColor}`}>
            {icon}
          </div>
        </div>
        
        <div className="mt-4 text-xs font-medium flex items-center gap-1">
          {subtext}
        </div>
      </Card>
    </motion.div>
  );
};
export default StatCard;
