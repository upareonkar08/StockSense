import React from 'react';
import { motion } from 'framer-motion';
import type { Holding } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface HoldingsTableProps {
  holdings: Holding[];
  limit?: number;
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({ holdings, limit }) => {
  const displayHoldings = limit ? holdings.slice(0, limit) : holdings;

  // Calculate totals
  const totalValue = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full divide-y divide-borderColor">
        <thead>
          <tr className="bg-slate-50/50">
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">
              Stock
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider hidden sm:table-cell">
              Company
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-textSecondary uppercase tracking-wider">
              Qty
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-textSecondary uppercase tracking-wider">
              Buy Price
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-textSecondary uppercase tracking-wider">
              Current
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-textSecondary uppercase tracking-wider">
              P&L
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-textSecondary uppercase tracking-wider">
              Weight
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-borderColor bg-white">
          {displayHoldings.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-sm text-textSecondary">
                No holdings added yet.
              </td>
            </tr>
          ) : (
            displayHoldings.map((holding, index) => {
              const value = holding.quantity * holding.currentPrice;
              const cost = holding.quantity * holding.buyPrice;
              const pnl = value - cost;
              const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
              const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;

              return (
                <motion.tr
                  key={holding.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-4 py-3.5 whitespace-nowrap text-sm font-bold text-textPrimary">
                    {holding.symbol}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-sm text-textSecondary hidden sm:table-cell">
                    {holding.companyName}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right text-textPrimary">
                    {holding.quantity}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right text-textSecondary">
                    {formatCurrency(holding.buyPrice)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right text-textPrimary font-semibold">
                    {formatCurrency(holding.currentPrice)}
                  </td>
                  <td className={`px-4 py-3.5 whitespace-nowrap text-sm text-right font-semibold ${
                    pnl >= 0 ? 'text-success' : 'text-danger'
                  }`}>
                    <div className="flex flex-col items-end">
                      <span>{formatCurrency(pnl)}</span>
                      <span className="text-[10px] opacity-90">{formatPercent(pnlPercent)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right text-textPrimary font-medium">
                    {weight.toFixed(1)}%
                  </td>
                </motion.tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
export default HoldingsTable;
