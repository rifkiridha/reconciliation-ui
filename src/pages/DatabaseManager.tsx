import React, { useEffect, useState } from 'react';
import {
  Database,
  Table as TableIcon,
  Plus,
  Trash2,
  Edit2,
  Play,
  Download,
  Upload,
  RefreshCw,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Terminal,
  FileCode,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { DatabaseItem, TableItem, ColumnItem } from '../types';
import { PageId } from '../components/Sidebar';

interface DatabaseManagerProps {
  onNavigate: (page: PageId, extra?: any) => void;
}

export const DatabaseManager: React.FC<DatabaseManagerProps> = ({ onNavigate }) => {
  const [databases, setDatabases] = useState<DatabaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);

  // Modals & Forms
  const [showCreateDbModal, setShowCreateDbModal] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [newDbDesc, setNewDbDesc] = useState('');
  const [creatingDb, setCreatingDb] = useState(false);

  // Query Runner
  const [querySql, setQuerySql] = useState('SELECT * FROM tbl_BANK_CORE_core_transactions LIMIT 10;');
  const [queryRunning, setQueryRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<{ columns: string[]; rows: any[]; rowCount: number } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Sample data generation
  const [genCount, setGenCount] = useState(5);
  const [generating, setGenerating] = useState(false);

  // CSV Import
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [importing, setImporting] = useState(false);

  const loadDatabases = async () => {
    setLoading(true);
    try {
      const data = await api.getDatabases();
      setDatabases(data);
      if (data.length > 0 && !selectedDb) {
        setSelectedDb(data[0].name);
        if (data[0].tables && data[0].tables.length > 0) {
          handleSelectTable(data[0].tables[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load databases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabases();
  }, []);

  const handleSelectTable = async (tableId: string) => {
    try {
      const detail = await api.getTableDetail(tableId);
      setSelectedTable(detail);
      setQuerySql(`SELECT * FROM ${detail.physical_table_name} LIMIT 10;`);
    } catch (err: any) {
      console.error('Failed to load table detail:', err);
    }
  };

  const handleCreateDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbName.trim()) return;
    setCreatingDb(true);
    try {
      await api.createDatabase({ name: newDbName.trim(), description: newDbDesc.trim() });
      setShowCreateDbModal(false);
      setNewDbName('');
      setNewDbDesc('');
      await loadDatabases();
    } catch (err: any) {
      alert('Gagal membuat database: ' + err.message);
    } finally {
      setCreatingDb(false);
    }
  };

  const handleDeleteDatabase = async (id: string, name: string) => {
    if (!confirm(`Hapus database '${name}' beserta seluruh tabel di dalamnya? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    try {
      await api.deleteDatabase(id);
      if (selectedDb === name) {
        setSelectedDb(null);
        setSelectedTable(null);
      }
      await loadDatabases();
    } catch (err: any) {
      alert('Gagal menghapus database: ' + err.message);
    }
  };

  const handleDeleteTable = async (tableId: string, tableName: string) => {
    if (!confirm(`Hapus tabel '${tableName}'? Data fisik akan di-drop dari database.`)) {
      return;
    }
    try {
      await api.deleteTable(tableId);
      if (selectedTable?.id === tableId) {
        setSelectedTable(null);
      }
      await loadDatabases();
    } catch (err: any) {
      alert('Gagal menghapus tabel: ' + err.message);
    }
  };

  const handleRunQuery = async () => {
    if (!querySql.trim()) return;
    setQueryRunning(true);
    setQueryError(null);
    try {
      const res = await api.executeQuery(querySql.trim());
      setQueryResult(res);
    } catch (err: any) {
      setQueryError(err.message);
      setQueryResult(null);
    } finally {
      setQueryRunning(false);
    }
  };

  const handleGenerateSample = async () => {
    if (!selectedTable) return;
    setGenerating(true);
    try {
      const res = await api.generateSampleRecords(selectedTable.id, genCount);
      alert(res.message);
      await handleSelectTable(selectedTable.id);
      await loadDatabases();
    } catch (err: any) {
      alert('Gagal membuat sampel data: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleImportCsv = async () => {
    if (!selectedTable || !csvContent.trim()) return;
    setImporting(true);
    try {
      const res = await api.importCsv(selectedTable.id, csvContent.trim());
      alert(`Berhasil mengimpor ${res.insertedCount} baris data ke tabel '${selectedTable.table_name}'.`);
      setShowImportModal(false);
      setCsvContent('');
      await handleSelectTable(selectedTable.id);
      await loadDatabases();
    } catch (err: any) {
      alert('Gagal mengimpor CSV: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Database Manager</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              Schema Catalog & SQL Explorer
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Navigasi struktur hierarki database, kelola skema tabel, dan jalankan kueri SQL
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateDbModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Database Baru</span>
          </button>
          <button
            onClick={() => onNavigate('table-designer', { databaseName: selectedDb })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-800 transition cursor-pointer"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Desain Tabel Baru</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Explorer Tree, Right Table Inspector & Query */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Tree View */}
        <div className="lg:col-span-4 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <FolderTree className="w-4 h-4 text-indigo-400" />
              <span>Hierarki Basis Data</span>
            </div>
            <button
              onClick={loadDatabases}
              title="Muat ulang pohon database"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="p-2 space-y-1.5 max-h-[600px] overflow-y-auto font-mono text-xs">
            {databases.map((db) => {
              const isSelected = selectedDb === db.name;
              return (
                <div key={db.id} className="rounded-lg border border-slate-800/60 bg-slate-900/60 overflow-hidden">
                  <div
                    onClick={() => setSelectedDb(db.name)}
                    className={`flex items-center justify-between p-2.5 cursor-pointer transition ${
                      isSelected ? 'bg-indigo-950/50 text-indigo-200 font-bold' : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Database className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate">{db.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-sans">
                        {db.tables?.length || 0} tbl
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDatabase(db.id, db.name);
                        }}
                        title={`Hapus database ${db.name}`}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Tables in this DB */}
                  {isSelected && (
                    <div className="pl-6 pr-2 py-1.5 space-y-1 bg-slate-950/40 border-t border-slate-800/50">
                      {(!db.tables || db.tables.length === 0) ? (
                        <div className="text-[11px] text-slate-500 py-1 font-sans italic">
                          Belum ada tabel.
                        </div>
                      ) : (
                        db.tables.map((t) => {
                          const isTableSelected = selectedTable?.id === t.id;
                          return (
                            <div
                              key={t.id}
                              onClick={() => handleSelectTable(t.id)}
                              className={`flex items-center justify-between px-2 py-1.5 rounded transition cursor-pointer ${
                                isTableSelected
                                  ? 'bg-indigo-600/30 text-white font-semibold border border-indigo-500/30'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <TableIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span className="truncate">{t.table_name}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-sans">
                                {t.rowCount || 0} baris
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Table Metadata & Query Runner */}
        <div className="lg:col-span-8 space-y-6">
          {selectedTable ? (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <TableIcon className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-base font-bold text-white font-mono">{selectedTable.table_name}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      DB: {selectedTable.database_name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Tabel Fisik: <span className="text-indigo-300 font-semibold">{selectedTable.physical_table_name}</span> • {selectedTable.rowCount || 0} baris data
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => onNavigate('data-explorer', { tableId: selectedTable.id })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer"
                  >
                    <span>Buka Data Explorer</span>
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import CSV</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTable(selectedTable.id, selectedTable.table_name)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-950/60 border border-red-900/60 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>

              {/* Table Schema Columns Inspector */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Struktur Kolom & Tipe Data
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Nama Kolom</th>
                        <th className="py-2 px-3">Tipe Data</th>
                        <th className="py-2 px-3">PK</th>
                        <th className="py-2 px-3">Nullable</th>
                        <th className="py-2 px-3">Unique</th>
                        <th className="py-2 px-3">Default</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {selectedTable.columns?.map((col, idx) => (
                        <tr key={col.id} className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-indigo-300">{col.column_name}</td>
                          <td className="py-2 px-3 text-slate-300">
                            {col.data_type}
                            {col.max_length ? `(${col.max_length})` : ''}
                          </td>
                          <td className="py-2 px-3">
                            {col.is_primary_key ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                                PK
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-400">
                            {col.is_nullable ? 'YES' : 'NO'}
                          </td>
                          <td className="py-2 px-3 text-slate-400">
                            {col.is_unique ? 'YES' : 'NO'}
                          </td>
                          <td className="py-2 px-3 text-slate-500">
                            {col.default_value || 'NULL'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sample Data Generator */}
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Tambahkan Transaksi Sampel ke Tabel Ini</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={genCount}
                    onChange={(e) => setGenCount(parseInt(e.target.value))}
                    className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1 font-mono"
                  >
                    <option value={5}>5 baris</option>
                    <option value={10}>10 baris</option>
                    <option value={25}>25 baris</option>
                  </select>
                  <button
                    onClick={handleGenerateSample}
                    disabled={generating}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded text-xs font-medium transition cursor-pointer"
                  >
                    {generating ? 'Membuat...' : 'Buat Sampel'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Pilih salah satu tabel dari panel hierarki di sebelah kiri untuk menginspeksi skema.</p>
            </div>
          )}

          {/* Interactive SQL Query Runner */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>SQL Query Runner (Read-Only)</span>
              </div>
              <button
                onClick={handleRunQuery}
                disabled={queryRunning}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{queryRunning ? 'Mengeksekusi...' : 'Jalankan Query'}</span>
              </button>
            </div>

            <div className="p-3 space-y-3">
              <textarea
                value={querySql}
                onChange={(e) => setQuerySql(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 text-indigo-300 font-mono text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Tulis kueri SELECT SQL di sini..."
              />

              {queryError && (
                <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-300 font-mono">
                  {queryError}
                </div>
              )}

              {queryResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Hasil: {queryResult.rowCount} baris ditemukan</span>
                  </div>
                  <div className="overflow-x-auto max-h-60 border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                        <tr>
                          {queryResult.columns.map((c) => (
                            <th key={c} className="py-2 px-3">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                        {queryResult.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            {queryResult.columns.map((c) => (
                              <td key={c} className="py-1.5 px-3 text-slate-300 truncate max-w-xs">
                                {row[c] !== null && row[c] !== undefined ? String(row[c]) : 'NULL'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create Database */}
      {showCreateDbModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-md space-y-4">
            <h3 className="text-sm font-bold text-white">Buat Database Baru</h3>
            <form onSubmit={handleCreateDatabase} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama Database (Alphanumeric / Underscore)
                </label>
                <input
                  type="text"
                  required
                  placeholder="CONTOH: RECON_EXTERNAL"
                  value={newDbName}
                  onChange={(e) => setNewDbName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan fungsi basis data..."
                  value={newDbDesc}
                  onChange={(e) => setNewDbDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateDbModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingDb}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer"
                >
                  {creatingDb ? 'Membuat...' : 'Buat Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import CSV */}
      {showImportModal && selectedTable && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-lg space-y-4">
            <h3 className="text-sm font-bold text-white">Import Data CSV ke {selectedTable.table_name}</h3>
            <p className="text-xs text-slate-400">
              Tempelkan isi CSV dengan baris pertama berupa header kolom yang sesuai dengan skema tabel.
            </p>
            <textarea
              rows={8}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="id,reference_no,transaction_date,amount,currency,transaction_status,channel&#10;REC-01,TRX-999,2026-10-01,1500000,IDR,SUCCESS,ATM"
              className="w-full bg-slate-950 font-mono text-xs text-slate-300 p-3 rounded-lg border border-slate-800 focus:border-indigo-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleImportCsv}
                disabled={importing || !csvContent.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer"
              >
                {importing ? 'Mengimpor...' : 'Mulai Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
