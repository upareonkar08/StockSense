import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';

interface AllocationPieChartProps {
  data: { sector: string; percentage: number }[] | { symbol: string; percentage: number; value?: number }[];
}

export const AllocationPieChart: React.FC<AllocationPieChartProps> = ({ data }) => {
  const COLORS = ['#6366F1', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#64748B', '#EC4899', '#8B5CF6'];

  const chartData = data.map((item) => {
    const name = 'sector' in item ? item.sector : item.symbol;
    return {
      name,
      value: item.percentage,
      rawValue: 'value' in item ? item.value : undefined
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-[250px] sm:h-[220px] w-full">
      {/* Chart container */}
      <div className="h-full w-full sm:w-[50%]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white border border-borderColor p-2.5 rounded-lg shadow-md text-left text-xs">
                      <p className="font-bold text-textPrimary">{data.name}</p>
                      <p className="text-textSecondary mt-0.5">
                        Allocation: <span className="font-semibold text-accent">{data.value}%</span>
                      </p>
                      {data.rawValue !== undefined && (
                        <p className="text-textSecondary">
                          Value: <span className="font-semibold text-textPrimary">₹{data.rawValue.toLocaleString()}</span>
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <div className="w-full sm:w-[50%] flex flex-col justify-center gap-2 max-h-[180px] overflow-y-auto pr-1">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate pr-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="font-medium text-textSecondary truncate">{item.name}</span>
            </div>
            <span className="font-bold text-textPrimary shrink-0">{item.value.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AllocationPieChart;
