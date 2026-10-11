import React, { useEffect, useState } from 'react';
import {
  CheckCheck,
  Search,
  Filter,
  Download,
  RefreshCw,
  ArrowRight,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { ReconciliationResultItem, JobExecutionItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface ReconciliationResultsProps {
  initialExecutionId?: string;
}

export const ReconciliationResults: React.FC<ReconciliationResultsProps> = ({ initialExecutionId }) => {
  const [executions, setExecutions] = useState<JobExecutionItem[]>([]);
  const [selectedExecId, setSelectedExecId] = useState<string>('');
  const [currentExecution, setCurrentExecution] = useState<JobExecutionItem | null>(null);

  const [results, setResults] = useState<ReconciliationResultItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Side-by-Side Modal Detail
  const [selectedResult, setSelectedResult] = useState<ReconciliationResultItem | null>(null);

  // Load executions list
  useEffect(() => {
    api.getExecutions().then((execList) => {
      setExecutions(execList);
      if (initialExecutionId && execList.some(e => e.id === initialExecutionId)) {
        setSelectedExecId(initialExecutionId);
      } else if (execList.length > 0) {
        setSelectedExecId(execList[0].id);
      }
    });
  }, [initialExecutionId]);

  // Load results whenever execution, statusFilter, page, search changes
  const loadResults = async () => {
    if (!selectedExecId) return;
    setLoading(true);
    try {
      const res = await api.getReconciliationResults({
        executionId: selectedExecId,
        status: statusFilter,
        search: searchTerm,
        page,
        limit,
      });

      setResults(res.results);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setCurrentExecution(res.execution);
    } catch (err: any) {
      console.error('Failed to load reconciliation results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [selectedExecId, statusFilter, page, limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadResults();
  };

  const handleExportCsv = () => {
    if (!selectedExecId) return;
    window.open(`/api/reports/export/${selectedExecId}?type=${statusFilter}`, '_blank');
  };

  const summary = currentExecution?.summary;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Reconciliation Results Dashboard</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Audit Inspection
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analisis perbandingan baris demi baris, verifikasi anomali selisih nominal, tanggal, status, dan ekspor laporan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={!selectedExecId || results.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Hasil CSV</span>
          </button>
        </div>
      </div>

      {/* Select Execution & Metrics Header */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400">Pilih Eksekusi:</span>
            <select
              value={selectedExecId}
              onChange={(e) => {
                setSelectedExecId(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 text-xs font-mono text-white rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none min-w-[300px]"
            >
              {executions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id} - {e.job_name} ({e.status})
                </option>
              ))}
            </select>
          </div>

          {currentExecution && (
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span>Waktu: {new Date(currentExecution.start_time).toLocaleString('id-ID')}</span>
              <span>•</span>
              <span>Durasi: {currentExecution.duration_ms}ms</span>
              <span>•</span>
              <StatusBadge status={currentExecution.status} />
            </div>
          )}
        </div>

        {/* KPI Mini Metric Grid */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center pt-2 border-t border-slate-800/80">
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-900/60">
              <div className="text-sm font-bold text-emerald-400 font-mono">{summary.matchedCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">MATCHED (100%)</div>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-900/60">
              <div className="text-sm font-bold text-amber-400 font-mono">{summary.amountMismatchCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">AMOUNT DIFF</div>
            </div>
            <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-900/60">
              <div className="text-sm font-bold text-sky-400 font-mono">{summary.dateMismatchCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">DATE DIFF</div>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-900/60">
              <div className="text-sm font-bold text-rose-400 font-mono">{summary.statusMismatchCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">STATUS DIFF</div>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-900/60">
              <div className="text-sm font-bold text-purple-400 font-mono">{summary.sourceOnlyCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">SOURCE ONLY</div>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-900/60">
              <div className="text-sm font-bold text-indigo-400 font-mono">{summary.targetOnlyCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">TARGET ONLY</div>
            </div>
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-900/60">
              <div className="text-sm font-bold text-red-400 font-mono">{summary.duplicateCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">DUPLICATE</div>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/60">
              <div className="text-sm font-bold text-zinc-300 font-mono">{summary.pendingCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">PENDING</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar & Search */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'MATCHED', label: 'Matched' },
            { id: 'AMOUNT_MISMATCH', label: 'Amount Diff' },
            { id: 'DATE_MISMATCH', label: 'Date Diff' },
            { id: 'STATUS_MISMATCH', label: 'Status Diff' },
            { id: 'SOURCE_ONLY', label: 'Source Only' },
            { id: 'TARGET_ONLY', label: 'Target Only' },
            { id: 'DUPLICATE', label: 'Duplicate' },
            { id: 'PENDING', label: 'Pending' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari kunci / alasan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 font-mono focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Results Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Matching Key</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Nominal Sumber</th>
                <th className="py-2.5 px-3">Nominal Target</th>
                <th className="py-2.5 px-3">Selisih</th>
                <th className="py-2.5 px-3">Alasan / Deskripsi Sistem</th>
                <th className="py-2.5 px-3 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                    Memuat hasil pencocokan transaksi...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    Tidak ada transaksi untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                results.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 text-slate-600">{(page - 1) * limit + idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-white font-mono">{row.matching_key || '-'}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={row.reconciliation_status} />
                    </td>
                    <td className="py-2.5 px-3 text-indigo-300">
                      {row.source_amount !== null && row.source_amount !== undefined ? `Rp ${row.source_amount.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-purple-300">
                      {row.target_amount !== null && row.target_amount !== undefined ? `Rp ${row.target_amount.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 font-bold">
                      {row.difference !== null && row.difference !== undefined ? (
                        <span className={row.difference === 0 ? 'text-emerald-400' : 'text-amber-400'}>
                          Rp {Math.abs(row.difference).toLocaleString('id-ID')}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-sm font-sans text-xs">
                      {row.reason}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedResult(row)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="Perbandingan Side-by-Side"
                      >
                        <Eye className="w-4 h-4 text-indigo-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-950/70 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Menampilkan <span className="text-white font-mono">{results.length}</span> dari <span className="text-white font-mono">{total}</span> catatan rekonsiliasi
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-white px-2">Halaman {page} dari {totalPages || 1}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-3xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white font-mono">
                  Inspeksi Komparasi: {selectedResult.matching_key}
                </span>
                <StatusBadge status={selectedResult.reconciliation_status} />
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-500 uppercase font-semibold text-[10px] block">Alasan / Diagnosa Matching:</span>
              <p className="text-slate-200 mt-1 font-sans">{selectedResult.reason}</p>
            </div>

            {/* Split: SOURCE DATA vs TARGET DATA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Source Record */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-900/40 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    SOURCE DATA (Operasional)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">ID: {selectedResult.source_record_id || 'NULL'}</span>
                </div>
                {selectedResult.sourceData ? (
                  <div className="space-y-1.5 font-mono text-xs">
                    {Object.entries(selectedResult.sourceData).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-white font-semibold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic py-4 text-center">
                    (Tidak ada rekaman sumber - Transaksi Target Only)
                  </div>
                )}
              </div>

              {/* Right: Target Record */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-900/40 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    TARGET DATA (Verifikasi/Settlement)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">ID: {selectedResult.target_record_id || 'NULL'}</span>
                </div>
                {selectedResult.targetData ? (
                  <div className="space-y-1.5 font-mono text-xs">
                    {Object.entries(selectedResult.targetData).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-white font-semibold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic py-4 text-center">
                    (Tidak ada rekaman target - Transaksi Source Only)
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
