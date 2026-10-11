import React, { useEffect, useState } from 'react';
import { FileText, ShieldCheck, RefreshCw, Search, Filter } from 'lucide-react';
import { api } from '../services/api';
import { AuditLogItem } from '../types';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(100);
      setLogs(data);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.action.toLowerCase().includes(term) ||
      l.description.toLowerCase().includes(term) ||
      l.entity_type.toLowerCase().includes(term) ||
      (l.entity_id && l.entity_id.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">System Audit Trail</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Immutable Operations Log
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Jejak rekaman seluruh aktivitas mutasi skema basis data, pembuatan modul, eksekusi job, dan intervensi pengguna
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Log</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari aksi audit, entitas, atau deskripsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg pl-9 pr-3 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Total: <strong className="text-white">{filteredLogs.length}</strong> catatan
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Waktu (Timestamp)</th>
                <th className="py-2.5 px-4">Aksi (Action)</th>
                <th className="py-2.5 px-4">Tipe Entitas</th>
                <th className="py-2.5 px-4">ID Entitas</th>
                <th className="py-2.5 px-4">Deskripsi Aktivitas</th>
                <th className="py-2.5 px-4 text-right">Hasil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    Tidak ada catatan audit yang cocok.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-300">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {log.entity_type}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {log.entity_id || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-sans text-xs max-w-md">
                      {log.description}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.result === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {log.result}
                      </span>
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
