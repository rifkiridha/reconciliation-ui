import React, { useEffect, useState } from 'react';
import {
  Workflow,
  Plus,
  Trash2,
  Copy,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  ChevronRight,
  Settings,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { JobItem, ModuleItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PageId } from '../components/Sidebar';

interface JobDesignerProps {
  onNavigate: (page: PageId, extra?: any) => void;
  onRunJob: (jobId: string) => void;
  isRunningJob: boolean;
}

export const JobDesigner: React.FC<JobDesignerProps> = ({ onNavigate, onRunJob, isRunningJob }) => {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Create Job Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newJobName, setNewJobName] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobList, modList] = await Promise.all([api.getJobs(), api.getModules()]);
      setJobs(jobList);
      setModules(modList);
      if (jobList.length > 0 && !selectedJob) {
        setSelectedJob(jobList[0]);
      } else if (selectedJob) {
        const updated = jobList.find(j => j.id === selectedJob.id);
        if (updated) setSelectedJob(updated);
      }
      if (modList.length > 0 && !selectedModuleId) {
        setSelectedModuleId(modList[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobName.trim()) return;
    setCreating(true);

    try {
      const formattedName = newJobName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      await api.createJob({
        jobName: formattedName.startsWith('JOB_') ? formattedName : `JOB_${formattedName}`,
        description: newJobDesc.trim(),
        moduleIds: [selectedModuleId],
        executionOrder: ['EXTRACT_SOURCE', 'EXTRACT_TARGET', selectedModuleId, 'GENERATE_REPORT'],
        dependencies: { [selectedModuleId]: ['EXTRACT_SOURCE', 'EXTRACT_TARGET'] },
        retryLimit: 3,
        timeoutSeconds: 300,
      });

      setShowCreateModal(false);
      setNewJobName('');
      setNewJobDesc('');
      await loadData();
    } catch (err: any) {
      alert('Gagal membuat job: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicateJob = async (jobId: string) => {
    try {
      const res = await api.duplicateJob(jobId);
      alert(`Job berhasil diduplikasi: ${res.jobName}`);
      await loadData();
    } catch (err: any) {
      alert('Gagal menduplikasi job: ' + err.message);
    }
  };

  const handleDeleteJob = async (jobId: string, jobName: string) => {
    if (!confirm(`Hapus job '${jobName}'?`)) return;
    try {
      await api.deleteJob(jobId);
      if (selectedJob?.id === jobId) setSelectedJob(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal menghapus job: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Job Designer & Orchestrator</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              Workflow Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Rancang urutan alur kerja eksekusi rekonsiliasi, sambungkan modul, dan jalankan orkestrasi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Job Baru</span>
          </button>
        </div>
      </div>

      {/* Split: Jobs List (Left) & Workflow Pipeline Visualizer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Jobs List */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Daftar Job Orkestrasi ({jobs.length})
          </h3>

          <div className="space-y-2.5 max-h-[650px] overflow-y-auto">
            {jobs.map((job) => {
              const isSelected = selectedJob?.id === job.id;
              const lastExec = job.lastExecution;

              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-950/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">{job.job_name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{job.description}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateJob(job.id);
                        }}
                        title="Duplikasi Job"
                        className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteJob(job.id, job.job_name);
                        }}
                        title="Hapus Job"
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {lastExec ? (
                        <>
                          <StatusBadge status={lastExec.status} />
                          <span className="text-[10px] text-slate-500 font-mono">
                            {lastExec.duration_ms}ms
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-500">Belum pernah dijalankan</span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRunJob(job.id);
                      }}
                      disabled={isRunningJob}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Run Now</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow Visualizer */}
        <div className="lg:col-span-7">
          {selectedJob ? (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white font-mono">{selectedJob.job_name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedJob.description}</p>
                </div>

                <button
                  onClick={() => onRunJob(selectedJob.id)}
                  disabled={isRunningJob}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-950/40 transition cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunningJob ? 'Mengeksekusi...' : 'Jalankan Job Ini'}</span>
                </button>
              </div>

              {/* Visual Pipeline DAG Nodes */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  Visual Execution Pipeline Workflow
                </span>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  {/* Step 1: START */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-700/80 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                      ▶
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex-1">
                      <div className="text-xs font-semibold text-white">Trigger Initialization (Manual / Cron)</div>
                      <div className="text-[11px] text-slate-400">Verifikasi lisensi dan alokasi memori runtime SQLite WASM</div>
                    </div>
                  </div>

                  {/* Connector */}
                  <div className="w-0.5 h-4 bg-slate-700 ml-4"></div>

                  {/* Step 2: Extraction */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-700/80 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                      1
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex-1">
                      <div className="text-xs font-semibold text-indigo-300">Data Extraction & Normalization</div>
                      <div className="text-[11px] text-slate-400">Membaca rekaman tabel sumber & target, pembersihan whitespace dan casting tipe</div>
                    </div>
                  </div>

                  {/* Connector */}
                  <div className="w-0.5 h-4 bg-slate-700 ml-4"></div>

                  {/* Step 3: Reconciliation Engine */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-950 border border-purple-700/80 text-purple-400 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                      2
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-purple-500/40 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-300">
                          Deterministic Reconciliation Engine
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 font-mono">
                          {selectedJob.module_ids.length} Modul Terlampir
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Pencocokan 1:1, deteksi duplikasi, evaluasi selisih nominal & tanggal
                      </div>
                    </div>
                  </div>

                  {/* Connector */}
                  <div className="w-0.5 h-4 bg-slate-700 ml-4"></div>

                  {/* Step 4: Summary & Audit */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-950 border border-amber-700/80 text-amber-400 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                      3
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex-1">
                      <div className="text-xs font-semibold text-amber-300">Result Commit & Audit Trail</div>
                      <div className="text-[11px] text-slate-400">Penyimpanan hasil ke _rms_reconciliation_results & logging eksekusi</div>
                    </div>
                  </div>

                  {/* Connector */}
                  <div className="w-0.5 h-4 bg-slate-700 ml-4"></div>

                  {/* Step 5: END */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-700/80 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                      ■
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex-1">
                      <div className="text-xs font-semibold text-emerald-400">Execution Completed</div>
                      <div className="text-[11px] text-slate-400">Kompilasi KPI, matching rate, dan persiapan laporan ekspor CSV</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Config Details */}
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 grid grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Batas Retry:</span>
                  <span className="text-white font-bold">{selectedJob.retry_limit} kali</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Timeout:</span>
                  <span className="text-white font-bold">{selectedJob.timeout_seconds} detik</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Status:</span>
                  <span className="text-emerald-400 font-bold">AKTIF</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
              Pilih salah satu job dari panel kiri untuk menginspeksi alur workflow pipeline.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Job */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-sm font-bold text-white">Buat Job Orkestrasi Baru</h3>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nama Job *</label>
                <input
                  type="text"
                  required
                  placeholder="JOB_RESTAURANT_ORDERS_RECON"
                  value={newJobName}
                  onChange={(e) => setNewJobName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Lampirkan Modul Rekonsiliasi *</label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                >
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.module_name} ({m.source_table} ➔ {m.target_table})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Deskripsi Job</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan jadwal dan target eksekusi..."
                  value={newJobDesc}
                  onChange={(e) => setNewJobDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition"
                >
                  {creating ? 'Menyimpan...' : 'Buat Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
