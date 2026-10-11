import React, { useEffect, useState } from 'react';
import {
  CalendarClock,
  Plus,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { ScheduleItem, JobItem } from '../types';

interface JobSchedulerProps {
  onRunJob: (jobId: string) => void;
  isRunningJob: boolean;
}

export const JobScheduler: React.FC<JobSchedulerProps> = ({ onRunJob, isRunningJob }) => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [scheduleName, setScheduleName] = useState('Jadwal Rekonsiliasi Malam (23:00 WIB)');
  const [cronExpression, setCronExpression] = useState('0 23 * * *');
  const [timezone, setTimezone] = useState('Asia/Jakarta');

  const loadData = async () => {
    setLoading(true);
    try {
      const [schs, jbs] = await Promise.all([api.getSchedules(), api.getJobs()]);
      setSchedules(schs);
      setJobs(jbs);
      if (jbs.length > 0 && !selectedJobId) {
        setSelectedJobId(jbs[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId || !cronExpression.trim()) return;

    try {
      await api.createSchedule({
        jobId: selectedJobId,
        scheduleName: scheduleName.trim(),
        cronExpression: cronExpression.trim(),
        timezone,
      });

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert('Gagal membuat jadwal: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Job Scheduler</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Cron Orchestration
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi ekspresi cron, zona waktu perbankan/bisnis, dan picu eksekusi ad-hoc secara instan
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Jadwal Baru</span>
        </button>
      </div>

      {/* Cloud Run / Container Sandbox Notice */}
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/60 flex items-start gap-3 text-xs text-amber-200">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-amber-300">Pemberitahuan Lingkungan Eksekusi & Penjadwalan</div>
          <p className="text-amber-200/80 leading-relaxed">
            Pada mode simulasi pratinjau container, penjadwalan otomatis berjalan dalam mode terbaik (best-effort timer).
            Eksekusi otomatis tanpa pengawasan di lingkungan produksi nyata memerlukan Google Cloud Scheduler atau Cloud Tasks yang memanggil endpoint Webhook. Gunakan tombol <span className="font-semibold text-white">Run Now</span> untuk pengujian deterministik instan.
          </p>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-4">Nama Jadwal</th>
                <th className="py-2.5 px-4">Job Terkait</th>
                <th className="py-2.5 px-4">Cron Expression</th>
                <th className="py-2.5 px-4">Zona Waktu</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Eksekusi Terakhir</th>
                <th className="py-2.5 px-4">Rencana Berikutnya</th>
                <th className="py-2.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    Belum ada jadwal yang dikonfigurasi.
                  </td>
                </tr>
              ) : (
                schedules.map((sch) => (
                  <tr key={sch.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-sans font-semibold text-white">{sch.schedule_name}</td>
                    <td className="py-3 px-4 text-indigo-300 font-bold">{sch.job_name || sch.job_id}</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold bg-slate-950/40">{sch.cron_expression}</td>
                    <td className="py-3 px-4 text-slate-400">{sch.timezone}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {sch.is_active ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {sch.last_execution ? new Date(sch.last_execution).toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {sch.next_planned_execution ? new Date(sch.next_planned_execution).toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onRunJob(sch.job_id)}
                        disabled={isRunningJob}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Run Now</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Schedule */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-sm font-bold text-white">Buat Jadwal Orkestrasi Cron</h3>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Job *</label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.job_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nama Jadwal *</label>
                <input
                  type="text"
                  required
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Ekspresi Cron (Menit Jam Hari Bulan HariMinggu) *</label>
                <input
                  type="text"
                  required
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                  placeholder="0 23 * * *"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Contoh: `30 23 * * *` (Pukul 23:30 setiap hari)</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Zona Waktu</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Asia/Jakarta">Asia/Jakarta (WIB, UTC+7)</option>
                  <option value="Asia/Makassar">Asia/Makassar (WITA, UTC+8)</option>
                  <option value="Asia/Jayapura">Asia/Jayapura (WIT, UTC+9)</option>
                  <option value="UTC">UTC (Universal Time Coordinated)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
