import { useState, useEffect } from 'react';
import { KeyRound, Plus, ShieldCheck, Check, Clock } from 'lucide-react';

interface Code {
  code: string;
  created_at: number;
  used: number;
  used_by_username: string | null;
}

export function AdminView() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem('turso-user-id');

  const fetchCodes = async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/admin/codes', {
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        const data = await res.json();
        setCodes(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, [userId]);

  const handleGenerate = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        await fetchCodes();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-center">
        <ShieldCheck className="absolute -right-4 -top-4 w-40 h-40 opacity-10" />
        <h3 className="font-bold text-2xl mb-2 relative z-10">Admin Dashboard</h3>
        <p className="text-indigo-200 relative z-10 max-w-lg mb-6">
          Kelola akses pengguna. Generate kode pendaftaran khusus untuk memberikan akses ke platform bagi pengguna baru.
        </p>
        
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold py-3 px-6 rounded-xl transition-colors shadow-md w-fit flex items-center gap-2 relative z-10 disabled:opacity-75 disabled:cursor-wait"
        >
          <Plus className="w-5 h-5" />
          {loading ? 'Generating...' : 'Buat Kode Pendaftaran Baru'}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <KeyRound className="w-5 h-5 text-indigo-600" />
          <h3 className="text-xl font-bold">Daftar Kode Pendaftaran</h3>
        </div>
        
        <div className="divide-y divide-slate-100">
          {codes.map((c) => (
            <div key={c.code} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-mono font-bold tracking-widest text-lg border border-slate-200">
                  {c.code}
                </div>
                <div className="flex flex-col">
                  {c.used === 1 ? (
                    <span className="text-slate-500 text-sm flex items-center gap-1 font-medium">
                       Digunakan oleh: <span className="font-bold text-slate-800">{c.used_by_username}</span>
                    </span>
                  ) : (
                    <span className="text-emerald-600 text-sm flex items-center gap-1 font-medium">
                       <Check className="w-4 h-4" /> Tersedia
                    </span>
                  )}
                  <span className="text-slate-400 text-xs flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3"/> Dibuat pada {new Date(c.created_at).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {codes.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              Belum ada kode pendaftaran yang digenerate.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
