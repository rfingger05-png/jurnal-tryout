import React, { useState } from 'react';
import { useWrongQuestions } from '../hooks/useWrongQuestions';
import { TryoutData } from '../hooks/useTryoutData';
import { BookOpen, Headphones, Trash2, PenSquare, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface CatatanTryoutViewProps {
  tryouts: TryoutData[];
  calculateTotals: (tryout: any) => any;
  deleteTryout: (id: string) => void;
}

export function CatatanTryoutView({ tryouts, calculateTotals, deleteTryout }: CatatanTryoutViewProps) {
  const { questions, deleteQuestion } = useWrongQuestions();
  const [expandedTryoutId, setExpandedTryoutId] = useState<string | null>(null);

  // Group questions by tryout_id
  const questionsByTryout = questions.reduce((acc, q) => {
    const tid = q.tryout_id || 'other';
    if (!acc[tid]) acc[tid] = [];
    acc[tid].push(q);
    return acc;
  }, {} as Record<string, typeof questions>);

  // Group tryouts by Date (Day)
  const tryoutsByDay = tryouts.reduce((acc, t) => {
    const dayStr = format(t.timestamp, 'yyyy-MM-dd');
    if (!acc[dayStr]) acc[dayStr] = [];
    acc[dayStr].push(t);
    return acc;
  }, {} as Record<string, typeof tryouts>);

  const sortedDays = Object.keys(tryoutsByDay).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const toggleExpand = (id: string) => {
    if (expandedTryoutId === id) setExpandedTryoutId(null);
    else setExpandedTryoutId(id);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Catatan Tryout</h3>
            <span className="text-slate-500 text-sm mt-0.5 inline-block">{tryouts.length} Tryout • {questions.length} Ulasan Salah</span>
          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
          {sortedDays.map((dayStr) => {
             const dayTryouts = tryoutsByDay[dayStr].sort((a,b) => b.timestamp - a.timestamp);
             const displayDate = format(new Date(dayStr), 'EEEE, dd MMMM yyyy', { locale: idLocale });
             
             return (
               <div key={dayStr} className="flex flex-col">
                 <div className="bg-slate-50 px-5 py-2.5 flex items-center gap-2 border-b border-slate-100">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold text-sm text-slate-700">{displayDate}</span>
                 </div>
                 
                 <div className="divide-y divide-slate-100">
                   {dayTryouts.map(t => {
                      const totals = calculateTotals(t);
                      const tryoutQs = questionsByTryout[t.id] || [];
                      const isExpanded = expandedTryoutId === t.id;

                      return (
                        <div key={t.id} className="flex flex-col">
                          {/* Tryout Header */}
                          <div 
                            onClick={() => toggleExpand(t.id)}
                            className="p-5 hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center group"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-slate-900 text-lg">
                                  {t.name ? t.name : format(t.timestamp, 'HH:mm', { locale: idLocale }) + ' WIB'}
                                </h4>
                              </div>
                              <div className="text-slate-500 text-sm mt-1 flex items-center gap-4">
                                <span className="font-medium text-emerald-600">Skor: {totals.totalScore.toFixed(1)}</span>
                                <span className="flex items-center gap-1 text-sky-600"><BookOpen className="w-3.5 h-3.5"/> {totals.readingScore}</span>
                                <span className="flex items-center gap-1 text-amber-600"><Headphones className="w-3.5 h-3.5"/> {totals.listeningScore}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-md ${tryoutQs.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                {tryoutQs.length} Ulasan
                              </span>
                              <div 
                                onClick={(e) => { e.stopPropagation(); deleteTryout(t.id); }}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Tryout"
                              >
                                <Trash2 className="w-4 h-4" />
                              </div>
                              {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />}
                            </div>
                          </div>

                          {/* Expanded Questions */}
                          {isExpanded && (
                            <div className="bg-slate-50/70 border-t border-slate-100 p-5 space-y-4">
                              <div className="flex items-center gap-3 text-sm text-slate-600 pl-2">
                                <span className="font-medium">Total Benar: </span> 
                                <span>Reading {totals.readingCorrect}/20</span> • 
                                <span>Listening {totals.listeningCorrect}/20</span>
                              </div>
                              
                              {tryoutQs.length > 0 ? (
                                <div className="space-y-3 mt-4">
                                  <h5 className="font-semibold text-slate-700 text-sm pl-2 mb-2">Soal yang Salah / Ulasan:</h5>
                                  {tryoutQs.map((q) => (
                                    <div key={q.id} className="flex justify-between items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm group/item">
                                      <div className="flex gap-4 w-full">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${q.category === 'reading' ? 'bg-sky-100 text-sky-600' : 'bg-amber-100 text-amber-600'}`}>
                                          {q.category === 'reading' ? <BookOpen className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1">
                                          <h4 className="font-bold text-slate-800">{q.question}</h4>
                                          <p className="text-slate-600 mt-1 whitespace-pre-wrap text-sm leading-relaxed">{q.notes}</p>
                                        </div>
                                      </div>
                                      
                                      <button 
                                        onClick={() => deleteQuestion(q.id)}
                                        className="text-slate-300 group-hover/item:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all border-none bg-transparent cursor-pointer flex-shrink-0"
                                        title="Hapus ulasan"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-slate-500 text-sm mt-3">
                                  Tidak ada soal yang diulas untuk tryout ini.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                   })}
                 </div>
               </div>
             );
          })}

          {tryouts.length === 0 && (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
              <PenSquare className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-lg">Belum ada riwayat tryout.</p>
              <p className="text-sm mt-1">Gunakan fitur 'Setoran Nilai' untuk menambahkan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
