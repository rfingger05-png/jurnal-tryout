import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { TryoutData, useTryoutData } from '../hooks/useTryoutData';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ProgressChartProps {
  data: TryoutData[];
  calculateTotals: ReturnType<typeof useTryoutData>['calculateTotals'];
}

export function ProgressChart({ data, calculateTotals }: ProgressChartProps) {
  const chartData = useMemo(() => {
    return data.map((tryout, index) => {
      const totals = calculateTotals(tryout);
      
      return {
        name: `TO #${index + 1}`,
        dateStr: format(tryout.timestamp, 'dd MMM', { locale: id }),
        totalScore: totals.totalScore,
        readingScore: totals.readingScore,
        listeningScore: totals.listeningScore,
      };
    });
  }, [data, calculateTotals]);

  if (chartData.length === 0) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center border border-gray-200 bg-white shadow-sm rounded-2xl text-gray-400">
        Belum ada data tryout.
      </div>
    );
  }

  const averageScore = chartData.reduce((acc, curr) => acc + curr.totalScore, 0) / chartData.length;

  return (
    <div className="h-[350px] w-full p-6 border border-gray-200 bg-white rounded-2xl shadow-sm relative">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#94a3b8" 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis 
            domain={[0, 100]} 
            stroke="#94a3b8" 
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickCount={6}
          />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const p = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-lg">
                    <div className="font-semibold text-gray-900 mb-3 border-b border-gray-100 pb-2">
                      {p.name} - <span className="text-gray-500 font-normal">{p.dateStr}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center gap-6">
                        <span className="text-gray-500 text-sm">Total Nilai:</span>
                        <span className="font-bold text-indigo-600 text-lg">
                          {p.totalScore}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-6">
                        <span className="text-gray-500 text-sm">Reading:</span>
                        <span className="font-medium text-gray-700">{p.readingScore}/50</span>
                      </div>
                      <div className="flex justify-between items-center gap-6">
                        <span className="text-gray-500 text-sm">Listening:</span>
                        <span className="font-medium text-gray-700">{p.listeningScore}/50</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          
          <ReferenceLine y={averageScore} stroke="#cbd5e1" strokeDasharray="5 5" />
          
          <Bar dataKey="totalScore" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.totalScore >= 80 ? '#6366f1' : '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
