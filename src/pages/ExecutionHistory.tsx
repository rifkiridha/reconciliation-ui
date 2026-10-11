import React, { useEffect, useState } from 'react';
import {
  History,
  Terminal,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { JobExecutionItem, ExecutionLogItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PageId } from '../components/Sidebar';

interface ExecutionHistoryProps {
  onNavigate: (page: PageId, extra?: any) => void;
  selectedExecId?: string;
}

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({ onNavigate, selectedExecId }) => {
  const [executions, setExecutions] = useState<JobExecutionItem[]>([]);
  const [activeExec, setActiveExec] = useState<JobExecutionItem | null>(null);
  const [logs, setLogs] = useState<ExecutionLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [logFilter, setLogFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getExecutions();
      setExecutions(data);

      let target = data[0] || null;
      if (selectedExecId) {
        const found = data.find(e => e.id === selectedExecId);
        if (found) target = found;
      }
      setActiveExec(target);
      if (target) {
        const logData = await api.getExecutionLogs(target.id);
        setLogs(logData);
      }
    } catch (err: any) {
      console.error('Failed to load executions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedExecId]);

  const handleSelectExecution = async (exec: JobExecutionItem) => {
    setActiveExec(exec);
    try {
      const logData = await api.getExecutionLogs(exec.id);
      setLogs(logData);
    } catch (err: any) {
      console.error('Failed to load logs:', err);
    }
  };

  const filteredLogs = logs.filter(l => {
    if (logFilter !== 'ALL' && l.log_level !== logFilter) return false;
    if (searchTerm && !l.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Execution History & Monitoring</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              Live Audit Log Stream
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pantau jejak eksekusi rekonsiliasi, metrik performa, dan log peristiwa sistem nyata
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Split: Execution Runs Table (Left) & Real Log Console (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Execution List */}
        <div className="lg:col-span-5 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-200">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              <span>Daftar Riwayat Eksekusi ({executions.length})</span>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[650px] overflow-y-auto">
            {executions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Belum ada eksekusi rekonsiliasi yang tercatat.
              </div>
            ) : (
              executions.map((e) => {
                const isSelected = activeExec?.id === e.id;
                return (
                  <div
                    key={e.id}
                    onClick={() => handleSelectExecution(e)}
                    className={`p-3.5 cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-950/40 border-l-4 border-indigo-500'
                        : 'hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white">{e.job_name}</span>
                      <StatusBadge status={e.status} />
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>ID: {e.id}</span>
                      <span>{e.duration_ms ? `${e.duration_ms}ms` : '-'}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        {new Date(e.start_time).toLocaleString('id-ID')}
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-emerald-400 font-bold">{e.matched_count} match</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-amber-400 font-bold">{e.unmatched_count} diff</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Step-by-Step Execution Logs Console */}
        <div className="lg:col-span-7 space-y-4">
          {activeExec ? (
            <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white font-mono">{activeExec.id}</h3>
                    <StatusBadge status={activeExec.status} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Job: <span className="text-indigo-300 font-semibold">{activeExec.job_name}</span> • Total Sumber: {activeExec.total_source} • Total Target: {activeExec.total_target}
                  </p>
                </div>

                <button
                  onClick={() => onNavigate('results', { executionId: activeExec.id })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer self-start sm:self-auto"
                >
                  <span>Lihat Tabel Hasil</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Console Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {(['ALL', 'INFO', 'WARN', 'ERROR', 'SUCCESS'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLogFilter(lvl)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                        logFilter === lvl
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
                  <input
                    type="text"
                    placeholder="Filter log..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-[11px] text-white rounded px-2 pl-6 py-1 font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Real Step Logs Stream Container */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs max-h-96 overflow-y-auto space-y-1.5">
                {filteredLogs.length === 0 ? (
                  <div className="text-slate-500 text-center py-6">
                    Tidak ada log untuk filter yang dipilih.
                  </div>
                ) : (
                  filteredLogs.map((log) => {
                    let levelColor = 'text-slate-400';
                    if (log.log_level === 'INFO') levelColor = 'text-sky-400';
                    if (log.log_level === 'WARN') levelColor = 'text-amber-400';
                    if (log.log_level === 'ERROR') levelColor = 'text-rose-400 font-bold';
                    if (log.log_level === 'SUCCESS') levelColor = 'text-emerald-400 font-bold';

                    return (
                      <div key={log.id} className="flex items-start gap-2 leading-relaxed hover:bg-slate-900/60 p-1 rounded">
                        <span className="text-[10px] text-slate-600 shrink-0">
                          {log.timestamp ? log.timestamp.substring(11, 19) : ''}
                        </span>
                        <span className={`text-[10px] uppercase font-bold shrink-0 w-14 ${levelColor}`}>
                          [{log.log_level}]
                        </span>
                        <span className="text-slate-300 break-all">{log.message}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
              Pilih eksekusi dari daftar di sebelah kiri untuk melihat log tahapan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
