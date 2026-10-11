import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  Database,
  Workflow,
  ArrowRight,
  RefreshCw,
  Clock,
  Layers,
  Scale
} from 'lucide-react';
import { api } from '../services/api';
import { JobExecutionItem, ModuleItem, DatabaseItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PageId } from '../components/Sidebar';

interface DashboardProps {
  onNavigate: (page: PageId, extra?: any) => void;
  onRunDefaultJob: () => void;
  isRunningJob: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onRunDefaultJob, isRunningJob }) => {
  const [loading, setLoading] = useState(true);
  const [executions, setExecutions] = useState<JobExecutionItem[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [databases, setDatabases] = useState<DatabaseItem[]>([]);
  const [latestExec, setLatestExec] = useState<JobExecutionItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [execList, modList, dbList] = await Promise.all([
        api.getExecutions(),
        api.getModules(),
        api.getDatabases(),
      ]);
      setExecutions(execList);
      setModules(modList);
      setDatabases(dbList);
      if (execList.length > 0) {
        setLatestExec(execList[0]);
      }
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = latestExec?.summary;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Ringkasan Sistem Rekonsiliasi</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              SISTEM AKTIF
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulasi Operasional Rekonsiliasi Perbankan & Settlement Kliring Multi-Switching
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
          <button
            onClick={onRunDefaultJob}
            disabled={isRunningJob}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-900/30 transition cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunningJob ? 'animate-bounce' : ''}`} />
            <span>{isRunningJob ? 'Menjalankan...' : 'Jalankan Job Harian'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Matching Rate */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Matching Rate Terakhir</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {summary ? `${summary.matchingRate}%` : '0%'}
            </span>
            <span className="text-xs text-slate-400">
              ({summary?.matchedCount || 0} dari {summary?.totalTransactions || 0} tx)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {latestExec ? `Job: ${latestExec.job_name}` : 'Belum ada eksekusi'}
          </div>
        </div>

        {/* KPI 2: Unmatched / Exceptions */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pengecualian / Selisih</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-300 font-mono">
              {summary?.unmatchedCount || 0}
            </span>
            <span className="text-xs text-slate-400">transaksi perlu review</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span>Nominal, Tanggal, atau Status mismatch</span>
          </div>
        </div>

        {/* KPI 3: Net Difference */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Net Selisih Finansial</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-white font-mono">
              Rp {(summary?.netDifference || 0).toLocaleString('id-ID')}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Sumber: Rp {(summary?.totalSourceAmount || 0).toLocaleString('id-ID')}
          </div>
        </div>

        {/* KPI 4: Databases & Modules */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Aset Platform</span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div>
              <span className="text-xl font-bold text-white font-mono">{databases.length}</span>
              <span className="text-xs text-slate-400 ml-1">DB</span>
            </div>
            <span className="text-slate-600">|</span>
            <div>
              <span className="text-xl font-bold text-white font-mono">{modules.length}</span>
              <span className="text-xs text-slate-400 ml-1">Modul</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Tersedia untuk orkestrasi harian
          </div>
        </div>
      </div>

      {/* Latest Execution Details Banner */}
      {latestExec ? (
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-mono text-xs font-bold border border-indigo-500/30">
                RUN
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">Eksekusi Terakhir: {latestExec.job_name}</h3>
                  <StatusBadge status={latestExec.status} />
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {latestExec.id} • Durasi: {latestExec.duration_ms || 0}ms • Waktu: {new Date(latestExec.start_time).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('results', { executionId: latestExec.id })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800 transition cursor-pointer self-start sm:self-auto"
            >
              <span>Buka Hasil Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Breakdown Pills */}
          {summary && (
            <div>
              <div className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">
                Distribusi Klasifikasi Hasil Pencocokan
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center">
                <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/60">
                  <div className="text-xs text-emerald-400 font-mono font-bold">{summary.matchedCount}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">MATCHED</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-900/60">
                  <div className="text-xs text-amber-400 font-mono font-bold">{summary.amountMismatchCount}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">AMOUNT DIFF</div>
                </div>
                <div className="p-2 rounded-lg bg-sky-950/40 border border-sky-900/60">
                  <div className="text-xs text-sky-400 font-mono font-bold">{summary.dateMismatchCount}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">DATE DIFF</div>
                </div>
                <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-900/60">
                  <div className="text-xs text-rose-400 font-mono font-bold">{summary.statusMismatchCount}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">STATUS DIFF</div>
                </div>
                <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-900/60">
                  <div className="text-xs text-purple-400 font-mono font-bold">{summary.sourceOnlyCount}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">SOURCE ONLY</div>
                </div>
                <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-900/60">
                  <div className="text-xs text-indigo-400 font-mono font-bold">{summary.targetOnlyCount}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">TARGET ONLY</div>
                </div>
                <div className="p-2 rounded-lg bg-red-950/40 border border-red-900/60">
                  <div className="text-xs text-red-400 font-mono font-bold">{summary.duplicateCount}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">DUPLICATE</div>
                </div>
                <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/60">
                  <div className="text-xs text-zinc-300 font-mono font-bold">{summary.pendingCount}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">PENDING</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <Workflow className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">Belum Ada Riwayat Eksekusi Rekonsiliasi</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Klik tombol di bawah untuk menjalankan job rekonsiliasi harian standar menggunakan dataset bawaan BANK_CORE dan SWITCHING.
          </p>
          <button
            onClick={onRunDefaultJob}
            disabled={isRunningJob}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Jalankan Rekonsiliasi Sekarang</span>
          </button>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('databases')}
          className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
          </div>
          <h4 className="text-sm font-semibold text-white mt-3">Database Manager</h4>
          <p className="text-xs text-slate-400 mt-1">
            Kelola skema basis data, inspeksi tabel fisik, dan jalankan kueri SQL SELECT.
          </p>
        </div>

        <div
          onClick={() => onNavigate('modules')}
          className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
          </div>
          <h4 className="text-sm font-semibold text-white mt-3">Reconciliation Modules</h4>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi pemetaan kolom sumber-ke-target, toleransi nominal, dan aturan perbandingan.
          </p>
        </div>

        <div
          onClick={() => onNavigate('jobs')}
          className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Workflow className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition" />
          </div>
          <h4 className="text-sm font-semibold text-white mt-3">Job Orchestrator</h4>
          <p className="text-xs text-slate-400 mt-1">
            Rangkai pipeline rekonsiliasi modular, kelola urutan dependensi, dan pantau log eksekusi.
          </p>
        </div>
      </div>

      {/* Recent Executions Table */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Riwayat Eksekusi Terbaru</h3>
            <p className="text-xs text-slate-400">Daftar rekonsiliasi yang baru saja diproses oleh mesin eksekusi</p>
          </div>
          <button
            onClick={() => onNavigate('executions')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Execution ID</th>
                <th className="py-2.5 px-4">Nama Job</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Waktu Mulai</th>
                <th className="py-2.5 px-4">Durasi</th>
                <th className="py-2.5 px-4">Matched</th>
                <th className="py-2.5 px-4">Unmatched</th>
                <th className="py-2.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {executions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500 font-sans">
                    Belum ada eksekusi rekonsiliasi yang tercatat.
                  </td>
                </tr>
              ) : (
                executions.slice(0, 5).map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-slate-200">{e.id}</td>
                    <td className="py-3 px-4 font-sans text-white font-medium">{e.job_name}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(e.start_time).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{e.duration_ms ? `${e.duration_ms}ms` : '-'}</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">{e.matched_count}</td>
                    <td className="py-3 px-4 text-amber-400 font-bold">{e.unmatched_count}</td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => onNavigate('results', { executionId: e.id })}
                        className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 transition cursor-pointer"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
