import React, { useEffect, useState } from 'react';
import {
  TableProperties,
  Plus,
  Trash2,
  Code,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { DatabaseItem } from '../types';
import { PageId } from '../components/Sidebar';

interface ColumnRow {
  columnName: string;
  dataType: 'VARCHAR' | 'TEXT' | 'INTEGER' | 'BIGINT' | 'DECIMAL' | 'BOOLEAN' | 'DATE' | 'TIMESTAMP' | 'UUID';
  maxLength?: number;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  defaultValue?: string;
}

interface TableDesignerProps {
  onNavigate: (page: PageId, extra?: any) => void;
  initialDbName?: string;
}

export const TableDesigner: React.FC<TableDesignerProps> = ({ onNavigate, initialDbName }) => {
  const [databases, setDatabases] = useState<DatabaseItem[]>([]);
  const [selectedDb, setSelectedDb] = useState<string>('');
  const [tableName, setTableName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [columns, setColumns] = useState<ColumnRow[]>([
    { columnName: 'id', dataType: 'UUID', isNullable: false, isPrimaryKey: true, isUnique: true },
    { columnName: 'reference_no', dataType: 'VARCHAR', maxLength: 50, isNullable: false, isPrimaryKey: false, isUnique: false },
    { columnName: 'transaction_date', dataType: 'DATE', isNullable: false, isPrimaryKey: false, isUnique: false },
    { columnName: 'amount', dataType: 'DECIMAL', isNullable: false, isPrimaryKey: false, isUnique: false },
    { columnName: 'currency', dataType: 'VARCHAR', maxLength: 3, defaultValue: 'IDR', isNullable: false, isPrimaryKey: false, isUnique: false },
    { columnName: 'status', dataType: 'VARCHAR', maxLength: 20, isNullable: false, isPrimaryKey: false, isUnique: false },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // SQL Preview Modal
  const [previewSql, setPreviewSql] = useState<string | null>(null);

  useEffect(() => {
    api.getDatabases().then((dbs) => {
      setDatabases(dbs);
      if (initialDbName && dbs.some(d => d.name === initialDbName)) {
        setSelectedDb(initialDbName);
      } else if (dbs.length > 0) {
        setSelectedDb(dbs[0].name);
      }
    });
  }, [initialDbName]);

  const handleAddColumn = () => {
    setColumns([
      ...columns,
      {
        columnName: `col_${columns.length + 1}`,
        dataType: 'VARCHAR',
        maxLength: 50,
        isNullable: true,
        isPrimaryKey: false,
        isUnique: false,
      },
    ]);
  };

  const handleRemoveColumn = (idx: number) => {
    if (columns.length <= 1) {
      alert('Tabel harus memiliki minimal 1 kolom.');
      return;
    }
    setColumns(columns.filter((_, i) => i !== idx));
  };

  const updateColumn = (index: number, patch: Partial<ColumnRow>) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], ...patch };
    setColumns(updated);
  };

  const handlePreviewSql = async () => {
    if (!selectedDb || !tableName.trim()) {
      alert('Harap pilih database dan isi nama tabel terlebih dahulu.');
      return;
    }
    try {
      const res = await api.previewSqlDdl({
        databaseName: selectedDb,
        tableName: tableName.trim(),
        columns,
      });
      setPreviewSql(res.sql);
    } catch (err: any) {
      alert('Gagal menampilkan preview SQL: ' + err.message);
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDb) {
      setError('Pilih database target terlebih dahulu.');
      return;
    }
    if (!tableName.trim()) {
      setError('Nama tabel tidak boleh kosong.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.createTable(selectedDb, {
        tableName: tableName.trim(),
        description: description.trim(),
        columns,
      });

      setSuccessMsg(`Tabel '${tableName.trim().toLowerCase()}' berhasil dibuat di database '${selectedDb}'.`);
      setTimeout(() => {
        onNavigate('databases');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Dynamic Table Designer</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              DDL Generator
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Rancang tabel basis data baru tanpa menulis SQL manual. Sistem akan mengeksekusi DDL fisik SQLite secara aman.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePreviewSql}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview SQL DDL</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleCreateTable} className="space-y-6">
        {/* Table & DB Details Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Informasi Skema Tabel
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Pilih Database *
              </label>
              <select
                required
                value={selectedDb}
                onChange={(e) => setSelectedDb(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              >
                {databases.map((db) => (
                  <option key={db.id} value={db.name}>
                    {db.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nama Tabel (snake_case) *
              </label>
              <input
                type="text"
                required
                placeholder="misal: settlement_batches"
                value={tableName}
                onChange={(e) => setTableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Deskripsi Tabel
              </label>
              <input
                type="text"
                placeholder="Penjelasan fungsi data tabel..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Columns Builder Table */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Definisi Kolom ({columns.length} Kolom)
              </h3>
              <p className="text-[11px] text-slate-400">
                Atur nama kolom, tipe data, batasan primary key, keunikan, dan nilai default.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddColumn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kolom</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Nama Kolom *</th>
                  <th className="py-2.5 px-3">Tipe Data</th>
                  <th className="py-2.5 px-3">Max Length</th>
                  <th className="py-2.5 px-3 text-center">PK</th>
                  <th className="py-2.5 px-3 text-center">Nullable</th>
                  <th className="py-2.5 px-3 text-center">Unique</th>
                  <th className="py-2.5 px-3">Default Value</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {columns.map((col, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20">
                    <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>

                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        required
                        value={col.columnName}
                        onChange={(e) => updateColumn(idx, { columnName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                        className="w-36 bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-xs text-indigo-300 font-semibold focus:border-indigo-500 focus:outline-none"
                      />
                    </td>

                    <td className="py-2.5 px-3">
                      <select
                        value={col.dataType}
                        onChange={(e) => updateColumn(idx, { dataType: e.target.value as any })}
                        className="bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="VARCHAR">VARCHAR</option>
                        <option value="TEXT">TEXT</option>
                        <option value="INTEGER">INTEGER</option>
                        <option value="BIGINT">BIGINT</option>
                        <option value="DECIMAL">DECIMAL</option>
                        <option value="BOOLEAN">BOOLEAN</option>
                        <option value="DATE">DATE</option>
                        <option value="TIMESTAMP">TIMESTAMP</option>
                        <option value="UUID">UUID</option>
                      </select>
                    </td>

                    <td className="py-2.5 px-3">
                      {col.dataType === 'VARCHAR' ? (
                        <input
                          type="number"
                          value={col.maxLength || ''}
                          onChange={(e) => updateColumn(idx, { maxLength: parseInt(e.target.value) || undefined })}
                          className="w-20 bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                          placeholder="50"
                        />
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={col.isPrimaryKey}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          updateColumn(idx, { isPrimaryKey: checked, isNullable: !checked });
                        }}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        disabled={col.isPrimaryKey}
                        checked={col.isNullable}
                        onChange={(e) => updateColumn(idx, { isNullable: e.target.checked })}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer disabled:opacity-40"
                      />
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={col.isUnique}
                        onChange={(e) => updateColumn(idx, { isUnique: e.target.checked })}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={col.defaultValue || ''}
                        onChange={(e) => updateColumn(idx, { defaultValue: e.target.value })}
                        placeholder="null"
                        className="w-28 bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                      />
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveColumn(idx)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={() => onNavigate('databases')}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-900/30 transition disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Membuat Tabel Fisik...' : 'Buat Tabel Sekarang'}</span>
          </button>
        </div>
      </form>

      {/* SQL Preview Modal */}
      {previewSql && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <span>Generated SQL DDL Preview</span>
              </h3>
              <button
                onClick={() => setPreviewSql(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Tutup
              </button>
            </div>
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre">
              {previewSql}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewSql(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
