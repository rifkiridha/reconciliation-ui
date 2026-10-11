import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
  Filter,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { JobExecutionItem } from '../types';

export const ReportsExport: React.FC = () => {
  const [executions, setExecutions] = useState<JobExecutionItem[]>([]);
  const [summaryReport, setSummaryReport] = useState<any | null>(null);
  const [selectedExecId, setSelectedExecId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [execList, summary] = await Promise.all([
        api.getExecutions(),
        api.getReportsSummary(),
      ]);
      setExecutions(execList);
      setSummaryReport(summary);
      if (execList.length > 0 && !selectedExecId) {
        setSelectedExecId(execList[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadReport = (execId: string, type: 'ALL' | 'MATCHED' | 'UNMATCHED') => {
    window.open(`/api/reports/export/${execId}?type=${type}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Reports & Compliance Export</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              Audit Data Exporter
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Unduh laporan rekonsiliasi, daftar transaksi cocok & selisih, dan log audit settlement dalam format CSV standar
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Full Reconciliation Report */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 w-fit">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Laporan Rekonsiliasi Lengkap</h3>
            <p className="text-xs text-slate-400 mt-1">
              Seluruh rekaman hasil matching termasuk transaksi MATCHED, selisih nominal, tanggal, status, dan duplikat.
            </p>
          </div>
          <button
            onClick={() => handleDownloadReport(selectedExecId, 'ALL')}
            disabled={!selectedExecId}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Laporan Lengkap (.CSV)</span>
          </button>
        </div>

        {/* Card 2: Matched Only Report */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Laporan Transaksi Cocok (Matched)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Daftar transaksi yang 100% selaras dan siap untuk proses pembukuan kliring settlement akhir.
            </p>
          </div>
          <button
            onClick={() => handleDownloadReport(selectedExecId, 'MATCHED')}
            disabled={!selectedExecId}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Transaksi Cocok (.CSV)</span>
          </button>
        </div>

        {/* Card 3: Unmatched / Exceptions Report */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 w-fit">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Laporan Selisih (Exceptions)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Daftar transaksi anomali: Selisih saldo, perbedaan tanggal cut-off, status mismatch, atau transaksi gantung.
            </p>
          </div>
          <button
            onClick={() => handleDownloadReport(selectedExecId, 'UNMATCHED')}
            disabled={!selectedExecId}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900 border border-amber-800 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Laporan Selisih (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Target Execution Selector Table */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">Pilih Eksekusi Rekonsiliasi untuk Laporan</h3>
            <p className="text-xs text-slate-400">Pilih salah satu eksekusi dari riwayat operasional</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Eksekusi Terpilih:</span>
            <span className="text-xs font-mono text-indigo-300 font-bold bg-indigo-950/60 px-2 py-1 rounded border border-indigo-800">
              {selectedExecId || 'Belum dipilih'}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Pilih</th>
                <th className="py-2.5 px-3">Execution ID</th>
                <th className="py-2.5 px-3">Nama Job</th>
                <th className="py-2.5 px-3">Waktu Eksekusi</th>
                <th className="py-2.5 px-3">Matched</th>
                <th className="py-2.5 px-3">Unmatched</th>
                <th className="py-2.5 px-3 text-right">Ekspor Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {executions.map((e) => {
                const isSelected = selectedExecId === e.id;
                return (
                  <tr key={e.id} className={`hover:bg-slate-800/30 transition ${isSelected ? 'bg-indigo-950/30' : ''}`}>
                    <td className="py-2.5 px-3">
                      <input
                        type="radio"
                        name="execSelect"
                        checked={isSelected}
                        onChange={() => setSelectedExecId(e.id)}
                        className="text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">{e.id}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-300">{e.job_name}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(e.start_time).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{e.matched_count}</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">{e.unmatched_count}</td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <button
                        onClick={() => handleDownloadReport(e.id, 'ALL')}
                        className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 transition cursor-pointer"
                      >
                        CSV
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
