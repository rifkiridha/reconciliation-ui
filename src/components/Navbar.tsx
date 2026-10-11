import React from 'react';
import { Play, RotateCcw, Database, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface NavbarProps {
  onRunDefaultJob: () => void;
  isRunningJob: boolean;
  onRefreshData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onRunDefaultJob, isRunningJob, onRefreshData }) => {
  const [resetting, setResetting] = React.useState(false);
  const [resetMsg, setResetMsg] = React.useState<string | null>(null);

  const handleReset = async () => {
    if (!confirm('Apakah Anda yakin ingin me-reset database ke dataset awal (BANK_CORE, SWITCHING, modul, dan sampel)?')) {
      return;
    }
    setResetting(true);
    try {
      await api.resetSystem();
      setResetMsg('Basis data berhasil di-reset!');
      onRefreshData();
      setTimeout(() => setResetMsg(null), 3500);
    } catch (err: any) {
      alert('Gagal me-reset: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between px-5 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white font-bold tracking-wider">
          RMS
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight">Reconciliation Management Studio</h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-medium">
              v2.5 Enterprise
            </span>
          </div>
          <p className="text-xs text-slate-400">Enterprise Banking Reconciliation & Settlement Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Environment Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="font-semibold text-amber-300">SIMULATION MODE</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-mono text-[11px] flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-indigo-400" /> SQLite WASM Engine
          </span>
        </div>

        {resetMsg && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> {resetMsg}
          </span>
        )}

        {/* Reset Database Button */}
        <button
          onClick={handleReset}
          disabled={resetting}
          title="Reset database dan muat ulang data sampel perbankan awal"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition disabled:opacity-50 cursor-pointer"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{resetting ? 'Mereset...' : 'Reset DB'}</span>
        </button>

        {/* Run Default Job Trigger */}
        <button
          onClick={onRunDefaultJob}
          disabled={isRunningJob}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-900/30 border border-emerald-500/30 transition disabled:opacity-50 cursor-pointer"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isRunningJob ? 'animate-bounce' : ''}`} />
          <span>{isRunningJob ? 'Menjalankan...' : 'Jalankan Job Harian'}</span>
        </button>
      </div>
    </header>
  );
};
