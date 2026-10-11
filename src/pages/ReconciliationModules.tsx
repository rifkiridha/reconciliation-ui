import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Plus,
  Trash2,
  Play,
  Layers,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Database,
  Table as TableIcon,
  HelpCircle,
  Eye,
  Sliders,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { ModuleItem, DatabaseItem, TableItem } from '../types';
import { PageId } from '../components/Sidebar';

interface ReconciliationModulesProps {
  onNavigate: (page: PageId, extra?: any) => void;
  onRunJob: (jobId: string) => void;
  isRunningJob: boolean;
}

export const ReconciliationModules: React.FC<ReconciliationModulesProps> = ({
  onNavigate,
  onRunJob,
  isRunningJob,
}) => {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [databases, setDatabases] = useState<DatabaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Template Quick Provisioning Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('Restaurant Orders');
  const [templateType, setTemplateType] = useState<'ORDER_TO_PAYMENT' | 'TWO_SOURCE_TRANSACTION' | 'THREE_SOURCE_RECON' | 'INVENTORY_RECON' | 'CUSTOM_RECON'>('ORDER_TO_PAYMENT');
  const [generateSampleData, setGenerateSampleData] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionSuccess, setProvisionSuccess] = useState<string | null>(null);

  // Manual Create Module Wizard
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [sourceDb, setSourceDb] = useState('DEMO_OPERATIONS_DB');
  const [sourceTable, setSourceTable] = useState('coffee_orders');
  const [targetDb, setTargetDb] = useState('DEMO_RECORDS_DB');
  const [targetTable, setTargetTable] = useState('coffee_payments');
  const [matchFieldSource, setMatchFieldSource] = useState('order_id');
  const [matchFieldTarget, setMatchFieldTarget] = useState('order_id');
  const [creatingManual, setCreatingManual] = useState(false);

  const loadModulesAndDatabases = async () => {
    setLoading(true);
    try {
      const [mods, dbs] = await Promise.all([api.getModules(), api.getDatabases()]);
      setModules(mods);
      setDatabases(dbs);
    } catch (err: any) {
      console.error('Failed to load modules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModulesAndDatabases();
  }, []);

  const handleProvisionFromTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;
    setProvisioning(true);
    setProvisionSuccess(null);

    try {
      const res = await fetch('/api/modules/provision-from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleName: templateName.trim(),
          templateType,
          generateSampleData,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Gagal membuat modul dari template');
      }

      const data = await res.json();
      setProvisionSuccess(data.message);
      await loadModulesAndDatabases();
      setTimeout(() => {
        setShowTemplateModal(false);
        setProvisionSuccess(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProvisioning(false);
    }
  };

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    setCreatingManual(true);
    try {
      await api.createModule({
        moduleName: manualName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
        description: manualDesc.trim(),
        moduleType: 'Reconciliation / Matching',
        sourceDatabase: sourceDb,
        sourceTable: sourceTable,
        targetDatabase: targetDb,
        targetTable: targetTable,
        matchingConfig: {
          matchingFields: [{ sourceField: matchFieldSource, targetField: matchFieldTarget }],
          comparisonFields: [
            { sourceField: 'amount', targetField: 'amount', comparisonType: 'AMOUNT', tolerance: 0.00 }
          ],
          nullHandling: 'FAIL_ON_NULL',
          duplicatePolicy: 'FLAG_AMBIGUOUS'
        },
        status: 'Active'
      });
      setShowManualModal(false);
      setManualName('');
      setManualDesc('');
      await loadModulesAndDatabases();
    } catch (err: any) {
      alert('Gagal membuat modul: ' + err.message);
    } finally {
      setCreatingManual(false);
    }
  };

  const handleDeleteModule = async (id: string, name: string) => {
    if (!confirm(`Hapus modul rekonsiliasi '${name}'?`)) return;
    try {
      await api.deleteModule(id);
      await loadModulesAndDatabases();
    } catch (err: any) {
      alert('Gagal menghapus modul: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Reconciliation Modules</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              Configurable Pipelines
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Komponen rekonsiliasi modular yang dapat dilampirkan ke job otomatisasi settlement dan audit
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-900/30 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Buat dari Template (1-Klik)</span>
          </button>

          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kustom Wizard</span>
          </button>
        </div>
      </div>

      {/* Built-in Templates Banner */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Pustaka Template Rekonsiliasi Bisnis Bawaan</span>
          </div>
          <span className="text-[11px] text-slate-400">Otomatisasi skema tabel & job</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div
            onClick={() => {
              setTemplateName('Retail Store Orders');
              setTemplateType('ORDER_TO_PAYMENT');
              setShowTemplateModal(true);
            }}
            className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition"
          >
            <div className="font-semibold text-indigo-300">Order-to-Payment</div>
            <p className="text-[11px] text-slate-400 mt-1">Cocokkan order_id, order_amount vs paid_amount, tanggal, dan status.</p>
          </div>

          <div
            onClick={() => {
              setTemplateName('Payment Gateway Settlement');
              setTemplateType('TWO_SOURCE_TRANSACTION');
              setShowTemplateModal(true);
            }}
            className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/40 cursor-pointer transition"
          >
            <div className="font-semibold text-emerald-300">Two-Source Transaction</div>
            <p className="text-[11px] text-slate-400 mt-1">Pencocokan referensi transaksi POS vs laporan bank mitra 1:1.</p>
          </div>

          <div
            onClick={() => {
              setTemplateName('Cold Storage Inventory');
              setTemplateType('INVENTORY_RECON');
              setShowTemplateModal(true);
            }}
            className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition"
          >
            <div className="font-semibold text-amber-300">Inventory Stock Audit</div>
            <p className="text-[11px] text-slate-400 mt-1">Pencocokan product_code, pergerakan stok, dan hasil stock opname.</p>
          </div>

          <div
            onClick={() => {
              setTemplateName('Multi-Channel E-Commerce');
              setTemplateType('THREE_SOURCE_RECON');
              setShowTemplateModal(true);
            }}
            className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-purple-500/40 cursor-pointer transition"
          >
            <div className="font-semibold text-purple-300">Three-Source Recon</div>
            <p className="text-[11px] text-slate-400 mt-1">Arsitektur multi-tahap antara platform, payment gateway, dan settlement.</p>
          </div>
        </div>
      </div>

      {/* Modules List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((m) => {
          const cfg = m.matching_config || {};
          const matchingKeys = cfg.matchingFields || [];
          const comparisons = cfg.comparisonFields || [];

          return (
            <div
              key={m.id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white font-mono">{m.module_name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {m.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{m.description || 'Tanpa deskripsi'}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDeleteModule(m.id, m.module_name)}
                    className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                    title="Hapus Modul"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Data Source & Target Map */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Sumber:</span>
                  <span className="text-indigo-300 font-semibold truncate">
                    {m.source_database}.{m.source_table}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Target:</span>
                  <span className="text-purple-300 font-semibold truncate">
                    {m.target_database}.{m.target_table}
                  </span>
                </div>
              </div>

              {/* Matching & Comparison Rules pills */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Matching Key:
                  </span>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                    {matchingKeys.map((mk: any, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                        {mk.sourceField} = {mk.targetField}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Kolom Perbandingan:
                  </span>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                    {comparisons.map((cp: any, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {cp.sourceField} ({cp.comparisonType})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  Tipe: {m.module_type}
                </span>

                <button
                  onClick={() => onNavigate('jobs')}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  <span>Buka di Job Designer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Quick Template Provisioning */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Buat Modul dari Template Otomatis</h3>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Cukup masukkan nama modul bisnis Anda. Sistem akan membuat skema tabel sumber di DEMO_OPERATIONS_DB, tabel target di DEMO_RECORDS_DB, aturan matching, job eksekusi, dan data sampel.
            </p>

            {provisionSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{provisionSuccess}</span>
              </div>
            )}

            <form onSubmit={handleProvisionFromTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama Modul Bisnis (contoh: Restaurant Orders, Gym Memberships, Hospital Pharmacy) *
                </label>
                <input
                  type="text"
                  required
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="misal: Restaurant Orders"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pilih Pola Template
                </label>
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ORDER_TO_PAYMENT">Order-to-Payment (Pencocokan Pesanan vs Pembayaran)</option>
                  <option value="TWO_SOURCE_TRANSACTION">Two-Source Transaction (Transaksi 2 Sistem)</option>
                  <option value="INVENTORY_RECON">Inventory Reconciliation (Audit Stok Gudang)</option>
                  <option value="THREE_SOURCE_RECON">Three-Source Reconciliation (Multi-Channel Settlement)</option>
                  <option value="CUSTOM_RECON">Custom Generic Reconciliation (Kunci Kustom)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sampleDataChk"
                  checked={generateSampleData}
                  onChange={(e) => setGenerateSampleData(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="sampleDataChk" className="text-xs text-slate-300 cursor-pointer">
                  Generate data sampel sintetis (langsung siap diuji eksekusi)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={provisioning}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{provisioning ? 'Membuat Otomatis...' : 'Generate & Aktifkan Modul'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manual Custom Wizard */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white">Buat Modul Rekonsiliasi Kustom</h3>
            <form onSubmit={handleManualCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nama Modul *</label>
                <input
                  type="text"
                  required
                  placeholder="CUSTOM_SALES_RECON"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Deskripsi</label>
                <input
                  type="text"
                  placeholder="Keterangan alur rekonsiliasi..."
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Source Database</label>
                  <select
                    value={sourceDb}
                    onChange={(e) => setSourceDb(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  >
                    {databases.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Source Table</label>
                  <input
                    type="text"
                    required
                    value={sourceTable}
                    onChange={(e) => setSourceTable(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Database</label>
                  <select
                    value={targetDb}
                    onChange={(e) => setTargetDb(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  >
                    {databases.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Table</label>
                  <input
                    type="text"
                    required
                    value={targetTable}
                    onChange={(e) => setTargetTable(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Source Matching Field</label>
                  <input
                    type="text"
                    required
                    value={matchFieldSource}
                    onChange={(e) => setMatchFieldSource(e.target.value)}
                    placeholder="order_id"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Matching Field</label>
                  <input
                    type="text"
                    required
                    value={matchFieldTarget}
                    onChange={(e) => setMatchFieldTarget(e.target.value)}
                    placeholder="order_id"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingManual}
                  className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer"
                >
                  {creatingManual ? 'Menyimpan...' : 'Simpan Modul'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
