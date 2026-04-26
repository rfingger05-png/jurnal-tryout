import { useState, useEffect } from 'react';
import { useTryoutData } from './hooks/useTryoutData';
import { ProgressChart } from './components/ProgressChart';
import { Countdown } from './components/Countdown';
import { DailyAverageChart } from './components/DailyAverageChart';
import { CatatanTryoutView } from './components/CatatanTryoutView';
import { AdminView } from './components/AdminView';
import { SettingsView } from './components/SettingsView';
import { AuthScreen } from './components/AuthScreen';
import { ConsistencyHeatmap } from './components/ConsistencyHeatmap';
import { SetoranNilaiView } from './components/SetoranNilaiView';
import { Target, TrendingUp, BookOpen, Headphones, Trash2, Award, Menu, X, LayoutDashboard, BarChart3, History as HistoryIcon, PenSquare, LogOut, ShieldCheck, CheckCircle2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isToday } from 'date-fns';
import { id as dfnsId } from 'date-fns/locale';

export default function App() {
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('turso-user-id'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('turso-username'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('turso-role'));

  const handleLogin = (id: string, name: string, userRole: string) => {
    localStorage.setItem('turso-user-id', id);
    localStorage.setItem('turso-username', name);
    localStorage.setItem('turso-role', userRole);
    setUserId(id);
    setUsername(name);
    setRole(userRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('turso-user-id');
    localStorage.removeItem('turso-username');
    localStorage.removeItem('turso-role');
    setUserId(null);
    setUsername(null);
    setRole(null);
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'analytics' | 'catatan-tryout' | 'admin' | 'setoran' | 'settings'>('dashboard');

  const { data, addTryout, deleteTryout, calculateTotals, fetchTryouts } = useTryoutData();

  if (!userId) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const totalTryouts = data.length;
  const todayTryouts = data.filter(t => isToday(new Date(t.timestamp))).length;

  const highestScore = data.reduce((max, t) => {
    const total = calculateTotals(t).totalScore;
    return total > max ? total : max;
  }, 0);

  const averageScore = totalTryouts > 0
    ? data.reduce((acc, t) => acc + calculateTotals(t).totalScore, 0) / totalTryouts
    : 0;

  const passedTryouts = data.filter(t => calculateTotals(t).totalScore >= 97.5).length;
  const passRate = totalTryouts > 0 ? ((passedTryouts / totalTryouts) * 100).toFixed(0) : 0;

  const totalReading = data.reduce((acc, t) => acc + calculateTotals(t).readingScore, 0);
  const totalListening = data.reduce((acc, t) => acc + calculateTotals(t).listeningScore, 0);
  
  const studyPriority = totalTryouts === 0 ? 'Belum Ada' : (totalReading < totalListening ? 'Reading' : 'Listening');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }
  };
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'setoran', label: 'Setoran Nilai', icon: PenSquare },
    { id: 'analytics', label: 'Analitik', icon: BarChart3 },
    { id: 'catatan-tryout', label: 'Catatan Tryout', icon: BookOpen },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
    ...(role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: ShieldCheck }] : []),
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          EPS-TOPIK Tracker
        </div>
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8 md:mb-10 px-2 mt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              EPS-TOPIK Tracker
            </div>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id as any);
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            ))}
          </nav>
          
          <div className="mt-auto px-2">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-6">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Target Harian</div>
              <div className="flex items-end gap-1">
                <span className={`text-2xl font-bold leading-none ${todayTryouts >= 5 ? "text-emerald-600" : "text-indigo-600"}`}>
                  {todayTryouts}
                </span>
                <span className="text-slate-400 font-medium pb-0.5">/ 5 Tryout</span>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 truncate" title={username || 'User'}>Hi, {username}</span>
              <button 
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden min-h-screen flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shrink-0"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12 w-full flex-1">
          
          <motion.header 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 md:mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 capitalize">
              {navItems.find(i => i.id === currentView)?.label}
            </h1>
            <p className="text-slate-500 mt-2">
              {currentView === 'dashboard' && 'Pantau ringkasan perkembangan nilai tryout bahasa Korea Anda.'}
              {currentView === 'setoran' && 'Input hasil tryout dan catat soal yang salah.'}
              {currentView === 'analytics' && 'Analisis detail performa dan tren harian tryout Anda.'}
              {currentView === 'catatan-tryout' && 'Kumpulan riwayat tryout beserta ulasan soal yang salah.'}
              {currentView === 'admin' && 'Halaman admin untuk manajemen kode pendaftaran dan akses sistem.'}
              {currentView === 'settings' && 'Pengaturan akun dan preferensi.'}
            </p>
          </motion.header>

          <AnimatePresence mode="wait">
            {currentView === 'dashboard' && (
              <motion.div 
                key="dashboard"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* LEFT CONTENT */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                  
                  {/* COUNTDOWN & STATS ROW */}
                  <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Countdown />
                    
                    <div className="grid grid-cols-2 grid-rows-2 gap-4">
                      <div className="bg-white border border-slate-200 p-4 xl:p-5 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden group">
                        <div className="text-slate-500 text-xs xl:text-sm font-medium mb-1 z-10">Tertinggi</div>
                        <div className="text-2xl xl:text-3xl font-bold text-slate-800 z-10">{highestScore}</div>
                        <Award className="absolute -right-3 -bottom-3 w-16 h-16 text-emerald-50 opacity-50 group-hover:scale-110 transition-transform" />
                      </div>
                      
                      <div className="bg-white border border-slate-200 p-4 xl:p-5 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden group">
                        <div className="text-slate-500 text-xs xl:text-sm font-medium mb-1 z-10">Rata-rata</div>
                        <div className="text-2xl xl:text-3xl font-bold text-slate-800 z-10">{averageScore.toFixed(1)}</div>
                        <TrendingUp className="absolute -right-3 -bottom-3 w-16 h-16 text-indigo-50 opacity-50 group-hover:scale-110 transition-transform" />
                      </div>

                      <div className="bg-white border border-slate-200 p-4 xl:p-5 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden group">
                        <div className="text-slate-500 text-xs xl:text-sm font-medium mb-1 z-10">Lulus (&ge;97.5)</div>
                        <div className="text-2xl xl:text-3xl font-bold text-slate-800 z-10">{passRate}%</div>
                        <Target className="absolute -right-3 -bottom-3 w-16 h-16 text-sky-50 opacity-50 group-hover:scale-110 transition-transform" />
                      </div>

                      <div className="bg-white border border-slate-200 p-4 xl:p-5 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden group">
                        <div className="text-slate-500 text-xs xl:text-sm font-medium mb-1 z-10">Fokus</div>
                        <div className="text-lg xl:text-xl font-bold text-slate-800 z-10 truncate">{studyPriority}</div>
                        <BookOpen className="absolute -right-3 -bottom-3 w-16 h-16 text-amber-50 opacity-50 group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Target Harian</h3>
                      <p className="text-slate-500 text-sm mt-0.5">Selesaikan 5 tryout setiap hari untuk hasil optimal.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`text-3xl font-extrabold ${todayTryouts >= 5 ? "text-emerald-600" : "text-indigo-600"}`}>
                          {todayTryouts}
                        </span>
                        <span className="text-slate-400 font-medium"> / 5</span>
                      </div>
                      {todayTryouts >= 5 && (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm animate-in zoom-in">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* RIGHT SIDEBAR ON DASHBOARD */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  <motion.div variants={itemVariants} className="h-full">
                    <ConsistencyHeatmap data={data} calculateTotals={calculateTotals} />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {currentView === 'setoran' && (
               <motion.div 
                key="setoran"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -10 }}
              >
                <SetoranNilaiView onSuccess={fetchTryouts} />
              </motion.div>
            )}

            {currentView === 'analytics' && (
              <motion.div 
                key="analytics"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-8"
              >
                <motion.div variants={itemVariants}>
                  <DailyAverageChart data={data} calculateTotals={calculateTotals} />
                </motion.div>
                
                <motion.div variants={itemVariants} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col p-6">
                   <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-bold text-slate-900">Grafik Semua Tryout</h2>
                  </div>
                  <ProgressChart data={data} calculateTotals={calculateTotals} />
                </motion.div>
              </motion.div>
            )}

            {currentView === 'catatan-tryout' && (
              <motion.div 
                key="catatan-tryout"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -10 }}
              >
                <CatatanTryoutView tryouts={data} calculateTotals={calculateTotals} deleteTryout={deleteTryout} />
              </motion.div>
            )}

            {currentView === 'admin' && role === 'admin' && (
              <motion.div 
                key="admin"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -10 }}
              >
                <AdminView />
              </motion.div>
            )}

            {currentView === 'settings' && (
              <motion.div 
                key="settings"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -10 }}
              >
                <SettingsView />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
