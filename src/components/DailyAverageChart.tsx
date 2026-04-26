import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { TryoutData, useTryoutData } from '../hooks/useTryoutData';
import { CalendarDays } from 'lucide-react';

interface DailyAverageChartProps {
  data: TryoutData[];
  calculateTotals: ReturnType<typeof useTryoutData>['calculateTotals'];
}

export function DailyAverageChart({ data, calculateTotals }: DailyAverageChartProps) {
  const chartData = useMemo(() => {
    const dailyStats: Record<string, { totalScore: number; count: number, dateObj: Date }> = {};

    data.forEach(tryout => {
      const dateStr = format(tryout.timestamp, 'yyyy-MM-dd');
      if (!dailyStats[dateStr]) {
        dailyStats[dateStr] = { totalScore: 0, count: 0, dateObj: new Date(tryout.timestamp) };
      }
      dailyStats[dateStr].totalScore += calculateTotals(tryout).totalScore;
      dailyStats[dateStr].count += 1;
    });

    return Object.values(dailyStats)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .map(stat => ({
        name: format(stat.dateObj, 'dd MMM', { locale: id }),
        average: Math.round((stat.totalScore / stat.count) * 10) / 10,
      }));
  }, [data, calculateTotals]);

  if (chartData.length === 0) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center border border-gray-200 bg-white shadow-sm rounded-2xl text-gray-400">
        Belum ada data nilai harian.
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full p-6 border border-gray-200 bg-white rounded-2xl shadow-sm relative">
      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-indigo-500" /> Rata-rata Nilai Harian
      </h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
            <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number) => [`${value}`, 'Rata-rata']}
            />
            <Area type="monotone" dataKey="average" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
