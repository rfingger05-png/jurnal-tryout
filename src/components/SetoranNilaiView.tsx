import React, { useState } from 'react';
import { useTryoutData } from '../hooks/useTryoutData';
import { useWrongQuestions } from '../hooks/useWrongQuestions';
import { BookOpen, Headphones, Plus, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';

export function SetoranNilaiView({ onSuccess }: { onSuccess?: () => void }) {
  const { addTryout } = useTryoutData();
  const { addQuestion } = useWrongQuestions();

  const [step, setStep] = useState<1 | 2>(1);
  const [success, setSuccess] = useState(false);

  // Step 1 State
  const [name, setName] = useState('');
  const [reading, setReading] = useState('');
  const [listening, setListening] = useState('');

  // Step 2 State
  const [wrongItems, setWrongItems] = useState<Array<{ category: 'reading' | 'listening', question: string, notes: string }>>([]);
  const [currentWrongItem, setCurrentWrongItem] = useState({
    category: 'reading' as 'reading' | 'listening',
    question: '',
    notes: ''
  });

  const handleNextStep = () => {
    const r = parseInt(reading || '0', 10);
    const l = parseInt(listening || '0', 10);
    if (r > 20 || l > 20) return; // simple validation
    if (reading === '' && listening === '') return;
    setStep(2);
  };

  const handleAddWrongItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWrongItem.question.trim()) return;
    
    setWrongItems([...wrongItems, currentWrongItem]);
    setCurrentWrongItem({ category: 'reading', question: '', notes: '' });
  };

  const handleRemoveWrongItem = (index: number) => {
    setWrongItems(wrongItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const r = Math.min(parseInt(reading || '0', 10), 20);
    const l = Math.min(parseInt(listening || '0', 10), 20);

    // 1. Submit Tryout
    const newTryout = await addTryout({ reading: r, listening: l, name: name.trim() || undefined });

    // 2. Submit Wrong Questions
    if (newTryout) {
      for (const item of wrongItems) {
        await addQuestion({
          category: item.category,
          question: item.question,
          notes: item.notes,
          tryout_id: newTryout.id
        });
      }
    }

    setSuccess(true);
    if (onSuccess) onSuccess();
    setTimeout(() => {
      setStep(1);
      setName('');
      setReading('');
      setListening('');
      setWrongItems([]);
      setSuccess(false);
    }, 3000);
  };

  if (success) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Setoran Berhasil!</h2>
        <p className="text-slate-500 max-w-md">Data nilai dan ulasan soal salah telah disimpan. Terus semangat belajarnya!</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Setoran Nilai Tryout</h2>
        <p className="text-slate-500 mt-1">Langkah {step} dari 2: {step === 1 ? 'Input Nilai' : 'Ulasan Soal Salah'}</p>
        
        <div className="flex gap-2 mt-4">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-slate-200'} transition-colors`}></div>
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'} transition-colors`}></div>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-indigo-800 text-sm mb-6">
            Masukkan jumlah soal yang Anda jawab dengan benar (maksimal 20 untuk tiap kategori).
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Judul Tryout (Opsional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              placeholder="Contoh: Tryout ke-3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <BookOpen className="w-4 h-4 text-indigo-500" /> Benar di Reading
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={reading}
                  onChange={(e) => setReading(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-medium"
                  placeholder="0"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 font-medium font-mono">
                  / 20
                </div>
              </div>
              {parseInt(reading) > 20 && <p className="text-red-500 text-xs mt-2">Maksimal 20!</p>}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Headphones className="w-4 h-4 text-indigo-500" /> Benar di Listening
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={listening}
                  onChange={(e) => setListening(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-medium"
                  placeholder="0"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 font-medium font-mono">
                  / 20
                </div>
              </div>
              {parseInt(listening) > 20 && <p className="text-red-500 text-xs mt-2">Maksimal 20!</p>}
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              onClick={handleNextStep}
              disabled={(!reading && !listening) || parseInt(reading) > 20 || parseInt(listening) > 20}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-xl transition-colors shadow-sm flex items-center gap-2"
            >
              Lanjut ke Ulasan <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-sm mb-6">
            Catat soal-soal yang salah beserta alasannya agar Anda bisa mempelajarinya kembali. (Opsional, bisa langsung submit).
          </div>

          <form onSubmit={handleAddWrongItem} className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Kategori Soal</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 bg-white rounded-lg flex-1 hover:bg-indigo-50 transition-colors">
                  <input
                    type="radio"
                    name="category"
                    value="reading"
                    checked={currentWrongItem.category === 'reading'}
                    onChange={() => setCurrentWrongItem({ ...currentWrongItem, category: 'reading' })}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-700">Reading</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 bg-white rounded-lg flex-1 hover:bg-indigo-50 transition-colors">
                  <input
                    type="radio"
                    name="category"
                    value="listening"
                    checked={currentWrongItem.category === 'listening'}
                    onChange={() => setCurrentWrongItem({ ...currentWrongItem, category: 'listening' })}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <Headphones className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-700">Listening</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Topik / Soal</label>
              <input
                type="text"
                value={currentWrongItem.question}
                onChange={(e) => setCurrentWrongItem({ ...currentWrongItem, question: e.target.value })}
                placeholder="Ex: Soal gambar jam, tata bahasa (karena)"
                className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Catatan</label>
              <textarea
                rows={2}
                value={currentWrongItem.notes}
                onChange={(e) => setCurrentWrongItem({ ...currentWrongItem, notes: e.target.value })}
                placeholder="Catat kenapa salah..."
                className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={!currentWrongItem.question.trim()}
              className="w-full bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 font-semibold py-2.5 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-5 h-5"/> Tambah ke Daftar Ulasan
            </button>
          </form>

          {wrongItems.length > 0 && (
            <div className="space-y-3 mt-6">
              <h4 className="font-semibold text-slate-700">Daftar Ulasan ({wrongItems.length}):</h4>
              {wrongItems.map((item, index) => (
                <div key={index} className="flex justify-between items-start gap-4 p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                        {item.category === 'reading' ? <BookOpen className="w-4 h-4 text-indigo-500"/> : <Headphones className="w-4 h-4 text-indigo-500"/>}
                        <span className="font-bold text-slate-800">{item.question}</span>
                      </div>
                      <p className="text-slate-600 text-sm whitespace-pre-wrap">{item.notes}</p>
                   </div>
                   <button 
                     onClick={() => handleRemoveWrongItem(index)}
                     className="text-slate-400 hover:text-red-500 p-1"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              ))}
            </div>
          )}

          <div className="pt-6 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="text-slate-500 hover:text-slate-700 font-medium py-3 px-6 rounded-xl transition-colors"
            >
              Kembali
            </button>
            <button
              onClick={handleSubmit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors shadow-sm flex items-center gap-2"
            >
              Submit Hasil Tryout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
