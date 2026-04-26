import React, { useState } from 'react';
import { Lock, ShieldCheck, UserCircle } from 'lucide-react';

export function SettingsView() {
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  const userId = localStorage.getItem('turso-user-id');
  const username = localStorage.getItem('turso-username');
  const role = localStorage.getItem('turso-role');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 5) {
      setPasswordMessage('Password minimal 5 karakter!');
      return;
    }
    if (!userId) return;
    
    setPasswordLoading(true);
    setPasswordMessage('');
    
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });
      if (res.ok) {
        setPasswordMessage('Password berhasil diubah!');
        setNewPassword('');
      } else {
        const err = await res.json();
        setPasswordMessage('Gagal: ' + err.error);
      }
    } catch (err) {
      setPasswordMessage('Terjadi kesalahan.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-800 p-6 md:p-8">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <UserCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{username}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                {role === 'admin' ? 'Administrator' : 'User'}
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold">Ganti Password</h3>
          </div>
          
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password Baru</label>
              <input 
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                placeholder="Masukkan password baru minimal 5 karakter..."
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading || !newPassword}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors mt-2 disabled:opacity-50"
            >
              {passwordLoading ? 'Menyimpan...' : 'Simpan Password'}
            </button>
            {passwordMessage && (
              <div className={`mt-2 p-3 text-sm rounded-xl ${passwordMessage.includes('berhasil') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                {passwordMessage}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
