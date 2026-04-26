import React, { useMemo } from 'react';
import { TryoutData } from '../hooks/useTryoutData';
import { eachDayOfInterval, subDays, startOfWeek, endOfWeek, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Flame } from 'lucide-react';

interface ConsistencyHeatmapProps {
  data: TryoutData[];
  calculateTotals: (tryout: any) => any;
}

export function ConsistencyHeatmap({ data, calculateTotals }: ConsistencyHeatmapProps) {
  const dailyAverages = useMemo(() => {
    const stats: Record<string, { total: number; count: number }> = {};
    data.forEach(t => {
      const d = format(new Date(t.timestamp), 'yyyy-MM-dd');
      if (!stats[d]) stats[d] = { total: 0, count: 0 };
      stats[d].total += calculateTotals(t).totalScore;
      stats[d].count += 1;
    });
    
    const result: Record<string, number> = {};
    for (const key in stats) {
      result[key] = stats[key].total / stats[key].count;
    }
    return result;
  }, [data, calculateTotals]);

  const today = new Date();
  const startDate = startOfWeek(subDays(today, 105), { weekStartsOn: 1 }); // approx 15 weeks
  const endDate = endOfWeek(today, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  days.forEach((day, i) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getColor = (average?: number) => {
    if (average === undefined) return 'bg-slate-100 border-slate-200';
    if (average >= 97.5) return 'bg-emerald-600 border-emerald-700'; // Highest
    if (average >= 80) return 'bg-emerald-400 border-emerald-500'; // High
    if (average >= 60) return 'bg-emerald-300 border-emerald-400'; // Medium
    return 'bg-emerald-200 border-emerald-300'; // Low
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Flame className="w-5 h-5 text-emerald-500" />
          Konsistensi Latihan
        </h2>
      </div>

      <div className="flex-1 flex flex-col justify-center overflow-x-auto custom-scrollbar pb-2">
        <div className="flex gap-1.5 min-w-max mx-auto">
          {weeks.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-1.5">
              {week.map((date, dIndex) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const avg = dailyAverages[dateStr];
                const isFuture = date > today;
                
                return (
                  <div
                    key={dIndex}
                    title={`${format(date, 'dd MMM yyyy', { locale: id })}${avg !== undefined ? ` - Rata-rata: ${avg.toFixed(1)}` : ' - Belum ada data'}`}
                    className={`w-4 h-4 rounded-sm border ${isFuture ? 'bg-transparent border-transparent' : getColor(avg)} transition-colors`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-500 min-w-max mx-auto px-2">
          <span>Rendah</span>
          <div className="flex gap-1">
            <div className={`w-3 h-3 rounded-sm border ${getColor(undefined)}`}></div>
            <div className={`w-3 h-3 rounded-sm border ${getColor(40)}`}></div>
            <div className={`w-3 h-3 rounded-sm border ${getColor(70)}`}></div>
            <div className={`w-3 h-3 rounded-sm border ${getColor(85)}`}></div>
            <div className={`w-3 h-3 rounded-sm border ${getColor(100)}`}></div>
          </div>
          <span>Tinggi (&ge; 97.5)</span>
        </div>
      </div>
    </div>
  );
}
