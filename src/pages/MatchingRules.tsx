import React, { useEffect, useState } from 'react';
import { Sliders, Plus, Trash2, CheckCircle2, ShieldCheck, Scale, Calendar, AlertOctagon } from 'lucide-react';
import { api } from '../services/api';
import { MatchingRuleItem } from '../types';

export const MatchingRules: React.FC = () => {
  const [rules, setRules] = useState<MatchingRuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState('AMOUNT_COMPARISON');
  const [description, setDescription] = useState('');
  const [tolerance, setTolerance] = useState(0.00);
  const [toleranceDays, setToleranceDays] = useState(0);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await api.getMatchingRules();
      setRules(data);
    } catch (err: any) {
      console.error('Failed to load matching rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    try {
      const config: any = {};
      if (ruleType === 'AMOUNT_COMPARISON') config.tolerance = tolerance;
      if (ruleType === 'DATE_COMPARISON') config.toleranceDays = toleranceDays;
      if (ruleType === 'DUPLICATE_DETECTION') config.flagDuplicate = true;

      await api.createMatchingRule({
        ruleName: ruleName.trim(),
        ruleType,
        description: description.trim(),
        config,
      });

      setShowModal(false);
      setRuleName('');
      setDescription('');
      await loadRules();
    } catch (err: any) {
      alert('Gagal membuat aturan matching: ' + err.message);
    }
  };

  const getRuleIcon = (type: string) => {
    if (type === 'AMOUNT_COMPARISON') return Scale;
    if (type === 'DATE_COMPARISON') return Calendar;
    if (type === 'DUPLICATE_DETECTION') return AlertOctagon;
    return ShieldCheck;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Matching Rules Engine</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Deterministic Logic
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Katalog aturan pencocokan presisi: Kunci unik, perbandingan nominal, toleransi tanggal, dan proteksi duplikasi
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Aturan Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => {
          const Icon = getRuleIcon(rule.rule_type);
          return (
            <div
              key={rule.id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{rule.rule_name}</h3>
                    <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800">
                      {rule.rule_type}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{rule.description || 'Tanpa keterangan'}</p>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 font-mono text-xs text-slate-300">
                <span className="text-slate-500 block text-[10px] uppercase mb-1">Konfigurasi Aturan:</span>
                <pre className="text-emerald-400 text-[11px] whitespace-pre-wrap">
                  {JSON.stringify(rule.config, null, 2)}
                </pre>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-md space-y-4">
            <h3 className="text-sm font-bold text-white">Tambah Aturan Matching</h3>
            <form onSubmit={handleCreateRule} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nama Aturan *</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Strict Amount Comparison 0.00"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tipe Aturan</label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="EXACT_MATCH">Exact Match (Pencocokan Presisi 1:1)</option>
                  <option value="AMOUNT_COMPARISON">Amount Comparison (Perbandingan Nilai Nominal)</option>
                  <option value="DATE_COMPARISON">Date Comparison (Toleransi Hari Transaksi)</option>
                  <option value="STATUS_COMPARISON">Status Comparison (Penyelarasan Status Transaksi)</option>
                  <option value="DUPLICATE_DETECTION">Duplicate Detection (Isolasi Transaksi Ganda)</option>
                </select>
              </div>

              {ruleType === 'AMOUNT_COMPARISON' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Toleransi Nominal (Rupiah)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tolerance}
                    onChange={(e) => setTolerance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              )}

              {ruleType === 'DATE_COMPARISON' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Toleransi Tanggal (Hari)</label>
                  <input
                    type="number"
                    value={toleranceDays}
                    onChange={(e) => setToleranceDays(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan implementasi aturan bisnis..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition"
                >
                  Simpan Aturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
