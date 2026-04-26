import { differenceInDays } from 'date-fns';
import { CalendarClock } from 'lucide-react';

export function Countdown() {
  const examDate = new Date('2026-06-26T00:00:00');
  const now = new Date();
  const daysLeft = differenceInDays(examDate, now);
  const isPassed = daysLeft < 0;

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden h-full flex flex-col justify-center min-h-[160px]">
      <CalendarClock className="absolute -right-4 -top-4 w-32 h-32 opacity-10" />
      <h3 className="font-semibold text-indigo-100 text-sm uppercase tracking-wider mb-2">Target Ujian EPS-TOPIK</h3>
      <div className="flex items-baseline gap-2 mt-1 z-10">
        <span className="text-5xl font-extrabold shadow-sm leading-none">{isPassed ? 0 : daysLeft}</span>
        <span className="text-indigo-100 font-medium text-lg">Hari lagi</span>
      </div>
      <p className="text-sm text-indigo-100 mt-3 font-medium z-10 bg-indigo-900/20 inline-block px-3 py-1 rounded-full w-max">26 Juni 2026</p>
    </div>
  );
}
