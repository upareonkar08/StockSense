import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface DrawdownChartProps {
  data: { date: string; portfolio: number; benchmark: number }[];
}

export const DrawdownChart: React.FC<DrawdownChartProps> = ({ data }) => {
  // Let's compute drawdowns based on the portfolio value peak-to-trough
  let peak = 0;
  const drawdownData = data.map((item) => {
    const val = item.portfolio;
    if (val > peak) {
      peak = val;
    }
    const drawdown = peak > 0 ? ((val - peak) / peak) * 100 : 0;
    
    // Parse the date (YYYY-MM to Month name)
    const monthParts = item.date.split('-');
    const label = monthParts.length > 1 
      ? new Date(parseInt(monthParts[0]), parseInt(monthParts[1]) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      : item.date;

    return {
      date: label,
      drawdown: parseFloat(drawdown.toFixed(2))
    };
  });

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={drawdownData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 10 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 10 }}
            tickFormatter={(value) => `${value}%`}
            dx={-8}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white border border-borderColor p-2 rounded shadow-md text-left text-xs">
                    <p className="font-semibold text-textSecondary">{payload[0].payload.date}</p>
                    <p className="text-danger font-bold mt-0.5">
                      Drawdown: {payload[0].value}%
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="drawdown"
            stroke="#EF4444"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#drawdownGradient)"
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
export default DrawdownChart;
