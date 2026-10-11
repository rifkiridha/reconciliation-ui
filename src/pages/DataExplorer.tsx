import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Download,
  Upload,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Database,
  Table as TableIcon,
  Filter,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { DatabaseItem, TableItem, ColumnItem } from '../types';

interface DataExplorerProps {
  initialTableId?: string;
}

export const DataExplorer: React.FC<DataExplorerProps> = ({ initialTableId }) => {
  const [databases, setDatabases] = useState<DatabaseItem[]>([]);
  const [selectedDb, setSelectedDb] = useState<string>('');
  const [tables, setTables] = useState<TableItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');

  // Records & Pagination
  const [records, setRecords] = useState<any[]>([]);
  const [columns, setColumns] = useState<ColumnItem[]>([]);
  const [currentTable, setCurrentTable] = useState<TableItem | null>(null);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');

  // Record Modals
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [recordFormData, setRecordFormData] = useState<Record<string, any>>({});
  const [savingRecord, setSavingRecord] = useState(false);

  // Load initial databases
  useEffect(() => {
    api.getDatabases().then(async (dbs) => {
      setDatabases(dbs);
      if (dbs.length > 0) {
        let initialDb = dbs[0].name;
        let initialTblId = '';

        if (initialTableId) {
          for (const d of dbs) {
            const match = d.tables?.find(t => t.id === initialTableId);
            if (match) {
              initialDb = d.name;
              initialTblId = match.id;
              break;
            }
          }
        } else if (dbs[0].tables && dbs[0].tables.length > 0) {
          initialTblId = dbs[0].tables[0].id;
        }

        setSelectedDb(initialDb);
        setTables(dbs.find(d => d.name === initialDb)?.tables || []);
        setSelectedTableId(initialTblId);
      }
    });
  }, [initialTableId]);

  // When database selection changes
  const handleDbChange = (dbName: string) => {
    setSelectedDb(dbName);
    const targetDb = databases.find(d => d.name === dbName);
    const tbls = targetDb?.tables || [];
    setTables(tbls);
    if (tbls.length > 0) {
      setSelectedTableId(tbls[0].id);
      setPage(1);
    } else {
      setSelectedTableId('');
      setRecords([]);
      setColumns([]);
      setCurrentTable(null);
    }
  };

  // Fetch records whenever table, page, search, sort changes
  const loadRecords = async () => {
    if (!selectedTableId) return;
    setLoading(true);
    try {
      const res = await api.getTableRecords(selectedTableId, {
        page,
        limit,
        search: searchTerm,
        sortBy,
        sortDir,
      });
      setRecords(res.records);
      setColumns(res.columns);
      setCurrentTable(res.table);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err: any) {
      console.error('Failed to load table records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [selectedTableId, page, limit, sortBy, sortDir]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadRecords();
  };

  const handleSort = (colName: string) => {
    if (sortBy === colName) {
      setSortDir(sortDir === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(colName);
      setSortDir('ASC');
    }
  };

  const handleOpenAddRecord = () => {
    setEditingRecord(null);
    const initial: Record<string, any> = {};
    columns.forEach(c => {
      initial[c.column_name] = c.default_value || '';
    });
    setRecordFormData(initial);
    setShowRecordModal(true);
  };

  const handleOpenEditRecord = (row: any) => {
    setEditingRecord(row);
    setRecordFormData({ ...row });
    setShowRecordModal(true);
  };

  const handleDeleteRecord = async (row: any) => {
    const pkCol = columns.find(c => c.is_primary_key === 1) || columns[0];
    const pkVal = row[pkCol.column_name];
    if (!confirm(`Hapus baris dengan ${pkCol.column_name}='${pkVal}'?`)) return;

    try {
      await api.deleteRecord(selectedTableId, pkVal);
      loadRecords();
    } catch (err: any) {
      alert('Gagal menghapus baris: ' + err.message);
    }
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableId) return;
    setSavingRecord(true);
    try {
      if (editingRecord) {
        const pkCol = columns.find(c => c.is_primary_key === 1) || columns[0];
        const pkVal = editingRecord[pkCol.column_name];
        await api.updateRecord(selectedTableId, pkVal, recordFormData);
      } else {
        await api.insertRecord(selectedTableId, recordFormData);
      }
      setShowRecordModal(false);
      loadRecords();
    } catch (err: any) {
      alert('Gagal menyimpan baris data: ' + err.message);
    } finally {
      setSavingRecord(false);
    }
  };

  const handleGenerateSample = async () => {
    if (!selectedTableId) return;
    try {
      const res = await api.generateSampleRecords(selectedTableId, 5);
      alert(res.message);
      loadRecords();
    } catch (err: any) {
      alert('Gagal membuat sampel data: ' + err.message);
    }
  };

  const handleExportCsv = () => {
    if (records.length === 0 || columns.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }
    const headers = columns.map(c => `"${c.column_name}"`).join(',');
    const rows = records.map(r =>
      columns.map(c => `"${(r[c.column_name] !== undefined && r[c.column_name] !== null ? String(r[c.column_name]) : '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentTable?.table_name || 'records'}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Data Explorer</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              Spreadsheet View
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Jelajahi, cari, saring, edit, dan kelola data transaksi perbankan langsung di database fisik
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateSample}
            disabled={!selectedTableId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/80 transition cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ 5 Sampel Data</span>
          </button>
          <button
            onClick={handleExportCsv}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={handleOpenAddRecord}
            disabled={!selectedTableId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Record</span>
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium text-slate-400">Database:</span>
            <select
              value={selectedDb}
              onChange={(e) => handleDbChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs font-mono text-white rounded-lg px-3 py-1.5 focus:border-indigo-500 focus:outline-none"
            >
              {databases.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium text-slate-400">Tabel:</span>
            <select
              value={selectedTableId}
              onChange={(e) => {
                setSelectedTableId(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 text-xs font-mono text-white rounded-lg px-3 py-1.5 focus:border-indigo-500 focus:outline-none"
            >
              {tables.map(t => (
                <option key={t.id} value={t.id}>{t.table_name} ({t.rowCount || 0})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari transaksi / nilai..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 focus:border-indigo-500 focus:outline-none w-56 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Spreadsheet Table View */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[11px] sticky top-0">
              <tr>
                <th className="py-2.5 px-3 w-12 text-slate-500">#</th>
                {columns.map(col => (
                  <th
                    key={col.id}
                    onClick={() => handleSort(col.column_name)}
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.column_name}</span>
                      {col.is_primary_key ? (
                        <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300">PK</span>
                      ) : null}
                      {sortBy === col.column_name && (
                        <span className="text-indigo-400 font-bold">{sortDir === 'ASC' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 2} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                    Memuat data tabel fisik...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="py-8 text-center text-slate-500 font-sans">
                    Tidak ada catatan transaksi ditemukan pada tabel ini.
                  </td>
                </tr>
              ) : (
                records.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-2 px-3 text-slate-600">{(page - 1) * limit + idx + 1}</td>
                    {columns.map(col => {
                      const val = row[col.column_name];
                      const isAmount = col.column_name.toLowerCase().includes('amount');
                      return (
                        <td key={col.id} className="py-2 px-3 truncate max-w-xs text-slate-300">
                          {isAmount && val !== null && val !== undefined ? (
                            <span className="text-emerald-300 font-semibold">
                              Rp {Number(val).toLocaleString('id-ID')}
                            </span>
                          ) : val !== null && val !== undefined ? (
                            String(val)
                          ) : (
                            <span className="text-slate-600 italic">null</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 font-sans">
                        <button
                          onClick={() => handleOpenEditRecord(row)}
                          title="Edit baris"
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(row)}
                          title="Hapus baris"
                          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
            Menampilkan <span className="text-white font-mono">{records.length}</span> dari <span className="text-white font-mono">{total}</span> total baris (Halaman {page} dari {totalPages || 1})
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-white px-2">Halaman {page}</span>
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

      {/* Modal: Add / Edit Record */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-lg space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white">
              {editingRecord ? 'Edit Baris Data' : 'Tambah Baris Baru'} ({currentTable?.table_name})
            </h3>
            <form onSubmit={handleSaveRecord} className="space-y-3">
              {columns.map(col => {
                const isPk = col.is_primary_key === 1;
                return (
                  <div key={col.id}>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {col.column_name} {isPk && '(Primary Key)'} {!col.is_nullable && '*'}
                    </label>
                    <input
                      type={col.data_type === 'INTEGER' || col.data_type === 'DECIMAL' ? 'number' : col.data_type === 'DATE' ? 'date' : 'text'}
                      step={col.data_type === 'DECIMAL' ? '0.01' : undefined}
                      required={!col.is_nullable && !isPk}
                      disabled={isPk && editingRecord}
                      value={recordFormData[col.column_name] !== undefined ? recordFormData[col.column_name] : ''}
                      onChange={(e) => setRecordFormData({ ...recordFormData, [col.column_name]: e.target.value })}
                      placeholder={isPk ? '(Otomatis jika dikosongkan)' : `Isi ${col.column_name}...`}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                );
              })}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingRecord}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer"
                >
                  {savingRecord ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
