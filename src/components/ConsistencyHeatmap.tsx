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
  
  let startDate = today;
  if (data && data.length > 0) {
    const minTimestamp = Math.min(...data.map(d => d.timestamp));
    startDate = new Date(minTimestamp);
  }

  // We want to show a grid of at least 140 boxes (approx 5 months)
  let endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 139);

  // If today is past the calculated endDate, we extend the grid to cover today
  if (today > endDate) {
    endDate = new Date(today);
  }

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getColor = (average?: number) => {
    if (average === undefined) return 'bg-slate-100 border-slate-300';
    if (average >= 97.5) return 'bg-emerald-600 border-slate-600'; // Highest
    if (average >= 80) return 'bg-emerald-400 border-slate-600'; // High
    if (average >= 60) return 'bg-emerald-300 border-slate-600'; // Medium
    return 'bg-emerald-200 border-slate-600'; // Low
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Flame className="w-5 h-5 text-emerald-500" />
          Konsistensi Latihan
        </h2>
      </div>

      <div className="flex-1 overflow-auto pb-2">
        <div className="flex flex-wrap gap-1.5 items-start content-start">
          {days.map((date, dIndex) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const avg = dailyAverages[dateStr];
            const isFuture = date > today;
            
            return (
              <div
                key={dIndex}
                title={`${format(date, 'dd MMM yyyy', { locale: id })}${avg !== undefined ? ` - Rata-rata: ${avg.toFixed(1)}` : ' - Belum ada data'}`}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-[3px] border ${getColor(avg)} transition-colors ${isFuture ? 'opacity-40' : ''}`}
              />
            );
          })}
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-500">
        <span>Rendah</span>
        <div className="flex gap-1.5">
          <div className={`w-4 h-4 rounded-[3px] border ${getColor(undefined)}`}></div>
          <div className={`w-4 h-4 rounded-[3px] border ${getColor(40)}`}></div>
          <div className={`w-4 h-4 rounded-[3px] border ${getColor(70)}`}></div>
          <div className={`w-4 h-4 rounded-[3px] border ${getColor(85)}`}></div>
          <div className={`w-4 h-4 rounded-[3px] border ${getColor(100)}`}></div>
        </div>
        <span>Tinggi (&ge; 97.5)</span>
      </div>
    </div>
  );
}
