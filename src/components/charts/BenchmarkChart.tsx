import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface BenchmarkChartProps {
  data: { date: string; portfolio: number; benchmark: number }[] | { month: string; portfolio: number; benchmark: number }[];
  benchmarkName?: string;
}

export const BenchmarkChart: React.FC<BenchmarkChartProps> = ({ data, benchmarkName = "S&P 500" }) => {
  // Normalize date formats
  const chartData = data.map((item) => {
    const key = 'date' in item ? item.date : item.month;
    let label = key;
    if (key.includes('-')) {
      const parts = key.split('-');
      if (parts.length > 1) {
        label = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }
    }
    return {
      label,
      Portfolio: item.portfolio,
      Benchmark: item.benchmark
    };
  });

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="benchmarkPortfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 11 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 11 }}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            dx={-8}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white border border-borderColor p-3 rounded-lg shadow-md text-left text-xs space-y-1">
                    <p className="font-semibold text-textSecondary border-b border-borderColor pb-1 mb-1">
                      {payload[0].payload.label}
                    </p>
                    <p className="font-bold text-accent">
                      Portfolio: {formatCurrency(payload[0].value as number)}
                    </p>
                    {payload[1] && (
                      <p className="font-bold text-slate-500">
                        {benchmarkName}: {formatCurrency(payload[1].value as number)}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
          />
          <Area
            name="Portfolio"
            type="monotone"
            dataKey="Portfolio"
            stroke="#6366F1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#benchmarkPortfolioGradient)"
            animationDuration={1500}
            animationEasing="ease-out"
          />
          <Line
            name={benchmarkName}
            type="monotone"
            dataKey="Benchmark"
            stroke="#94A3B8"
            strokeWidth={2}
            dot={false}
            strokeDasharray="4 4"
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
export default BenchmarkChart;
