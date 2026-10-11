import React, { useState } from 'react';
import {
  Presentation,
  Download,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers,
  Sparkles,
  Printer,
  ExternalLink
} from 'lucide-react';

interface SlideData {
  number: number;
  title: string;
  subtitle: string;
  category: string;
  summary: string;
  speakerNotes: string;
  content: React.ReactNode;
}

export const PresentationManager: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const slides: SlideData[] = [
    {
      number: 1,
      title: 'Reconciliation Studio',
      subtitle: 'Dynamic Data Reconciliation & Job Management Platform',
      category: 'TITLE',
      summary: 'Slide pembuka memperkenalkan nama aplikasi, fokus arsitektur, dan ringkasan eksekutif.',
      speakerNotes: 'Selamat pagi rekan-rekan. Hari ini kami mempresentasikan Reconciliation Studio, sebuah platform rekonsiliasi data dinamis berbasis full-stack TypeScript yang mengotomatisasi pencocokan transaksi, audit settlement finansial, dan orkestrasi job.',
      content: (
        <div className="h-full flex flex-col justify-center items-center text-center p-8 bg-slate-950 rounded-xl border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-xl shadow-indigo-600/30">
            RMS
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Reconciliation Studio</h1>
          <p className="text-indigo-400 font-medium text-base mt-2">
            Dynamic Data Reconciliation & Job Management Platform
          </p>
          <div className="mt-4 px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700">
            Enterprise Architecture • Deterministic Rule Engine • Template Factory • Audit Integrity
          </div>
          <div className="mt-8 text-xs text-slate-500 font-mono">
            Target Audience: Solution Architects, Software Developers, QA & Operations • Oktober 2026
          </div>
        </div>
      )
    },
    {
      number: 2,
      title: 'Background & Problem Statement',
      subtitle: 'Tantangan Rekonsiliasi Data Multi-Sumber di Lingkungan Enterprise',
      category: 'PROBLEM STATEMENT',
      summary: 'Menguraikan 4 masalah utama: Siloed database, proses manual rawan galat, skalabilitas kaku, dan jejak audit yang tidak transparan.',
      speakerNotes: 'Mengapa rekonsiliasi data menjadi titik hambatan kritis? Data transaksi tersebar di POS, gateway pembayaran, dan pembukuan internal. Rekonsiliasi manual via spreadsheet gagal menangani duplikasi ambigu dan perbedaan cut-off tanggal.',
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Alur kerja rekonsiliasi konvensional bergantung pada spreadsheet manual atau skrip SQL kaku dengan transparansi terbatas dan biaya operasional tinggi.
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="font-bold text-indigo-400">01. Siloed Heterogeneous Databases</div>
              <p className="text-slate-400 text-[11px]">Sistem operasional dan ledger settlement berada di database terpisah dengan skema yang berbeda.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="font-bold text-amber-400">02. Manual & Error-Prone Matching</div>
              <p className="text-slate-400 text-[11px]">VLOOKUP dan query manual gagal mendeteksi kandidat duplikat ganda atau pergeseran cut-off tanggal.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="font-bold text-purple-400">03. Kurangnya Skalabilitas Dinamis</div>
              <p className="text-slate-400 text-[11px]">Menambahkan aliran rekonsiliasi baru memerlukan modifikasi kode backend dan deployment baru.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="font-bold text-rose-400">04. Audit & Investigasi Tidak Transparan</div>
              <p className="text-slate-400 text-[11px]">Tim operasional kesulitan menelusuri alasan presisi mengapa suatu transaksi mengalami selisih nominal.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      number: 3,
      title: 'Application Overview',
      subtitle: 'Alur Siklus Hidup Rekonsiliasi End-to-End',
      category: 'SOLUTION OVERVIEW',
      summary: '5 tahapan terpadu: Data Management, Module Templates, Matching Engine, Job Orchestration, dan Results & Compliance.',
      speakerNotes: 'Reconciliation Studio mencakup seluruh siklus hidup: dari perancangan tabel fisik dinamis, pembuatan modul berbasis template 1-klik, eksekusi aturan deterministik, hingga inspeksi komparasi side-by-side.',
      content: (
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {[
            { num: '1', title: 'Data Management', desc: 'Kelola basis data logis, buat tabel fisik dinamis, impor CSV.' },
            { num: '2', title: 'Module Templates', desc: 'Provisioning modul 1-klik: auto-create tabel, aturan, dan job.' },
            { num: '3', title: 'Matching Engine', desc: 'Pencocokan 1:1, evaluasi toleransi nominal, tanggal, dan status.' },
            { num: '4', title: 'Job Orchestration', desc: 'Rangkai pipeline DAG, kunci concurrency, retry, dan batas timeout.' },
            { num: '5', title: 'Results & Compliance', desc: 'Inspeksi side-by-side, highlight selisih, dan ekspor CSV.' },
          ].map((s) => (
            <div key={s.num} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 mx-auto flex items-center justify-center font-bold font-mono">
                {s.num}
              </div>
              <div className="font-bold text-white text-[11px]">{s.title}</div>
              <p className="text-[10px] text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      number: 4,
      title: 'Core Platform Capabilities',
      subtitle: 'Matriks Fitur Terimplementasi vs Rencana Produksi',
      category: 'CAPABILITIES MATRIX',
      summary: 'Menampilkan fitur operasional nyata yang diverifikasi dalam kode sumber.',
      speakerNotes: 'Matriks ini menegaskan bahwa fitur-fitur seperti Database Manager, Dynamic Table Designer, Template Factory, Matching Engine, dan Results Dashboard berjalan secara nyata terhadap query basis data fisik.',
      content: (
        <div className="overflow-x-auto rounded-lg border border-slate-800 text-[11px]">
          <table className="w-full text-left font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-2">Modul Fitur</th>
                <th className="p-2">Kemampuan Terimplementasi</th>
                <th className="p-2">Status Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
              <tr><td className="p-2 text-indigo-300 font-bold">Database Manager</td><td className="p-2 text-slate-300 font-sans">Pohon DB, metadata tabel fisik, query runner SELECT read-only, ekspor CSV</td><td className="p-2 text-emerald-400 font-bold">Verified Operational</td></tr>
              <tr><td className="p-2 text-indigo-300 font-bold">Table Designer</td><td className="p-2 text-slate-300 font-sans">Generator DDL: UUID, VARCHAR, DECIMAL, DATE, PK, Unique, Nullable</td><td className="p-2 text-emerald-400 font-bold">Verified Operational</td></tr>
              <tr><td className="p-2 text-indigo-300 font-bold">Module Templates</td><td className="p-2 text-slate-300 font-sans">1-klik auto-provision tabel sumber/target, aturan matching, job, data sampel</td><td className="p-2 text-emerald-400 font-bold">Verified Operational</td></tr>
              <tr><td className="p-2 text-indigo-300 font-bold">Matching Engine</td><td className="p-2 text-slate-300 font-sans">Pencocokan 1:1, proteksi duplikasi ambigu, toleransi nominal & cut-off</td><td className="p-2 text-emerald-400 font-bold">Verified Operational</td></tr>
              <tr><td className="p-2 text-indigo-300 font-bold">Results Dashboard</td><td className="p-2 text-slate-300 font-sans">Inspeksi komparasi side-by-side, filter status, ekspor laporan CSV</td><td className="p-2 text-emerald-400 font-bold">Verified Operational</td></tr>
              <tr><td className="p-2 text-indigo-300 font-bold">Job Scheduler</td><td className="p-2 text-slate-300 font-sans">Ekspresi cron, zona waktu, tombol Run Now, catatan simulasi sandbox</td><td className="p-2 text-amber-400 font-bold">Simulated Preview</td></tr>
            </tbody>
          </table>
        </div>
      )
    },
    {
      number: 5,
      title: 'System Architecture',
      subtitle: 'Arsitektur Full-Stack Multi-Layer',
      category: 'SYSTEM ARCHITECTURE',
      summary: 'Menguraikan integrasi antara React SPA, Express REST API, Deterministic Engine, dan SQLite WASM.',
      speakerNotes: 'Arsitektur menerapkan decoupled pattern: frontend SPA berkomunikasi via REST API dengan Zod runtime validation, menjalankan pure deterministic engine tanpa dependensi eksternal.',
      content: (
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-indigo-900/40">
            <span className="font-bold text-indigo-400 block mb-1">Frontend Tier: React 19 + TypeScript + Tailwind CSS</span>
            <p className="text-slate-400 text-[11px]">Dashboard KPI, spreadsheet Data Explorer, modal perbandingan Side-by-Side, dan in-app Doc Viewer.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-teal-900/40">
            <span className="font-bold text-teal-400 block mb-1">Controller Tier: Express REST API + Zod Validation</span>
            <p className="text-slate-400 text-[11px]">Endpoints CRUD database, tabel, modul, eksekusi job, sanitasi identifikasi DDL SQL.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-purple-900/40">
            <span className="font-bold text-purple-400 block mb-1">Engine Tier: Deterministic Reconciliation & Job Orchestrator</span>
            <p className="text-slate-400 text-[11px]">Algoritma pencocokan 1:1, isolasi duplikasi ambigu, toleransi selisih nominal, dan concurrency locking.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-amber-900/40">
            <span className="font-bold text-amber-400 block mb-1">Storage Tier: SQLite WASM Embedded Simulator (sql.js)</span>
            <p className="text-slate-400 text-[11px]">Tabel fisik (tbl_DB_table), katalog skema (_rms_databases, _rms_tables), buffer file persistensi container.</p>
          </div>
        </div>
      )
    },
    {
      number: 6,
      title: 'Database Architecture & Schema Isolation',
      subtitle: 'Pemisahan Basis Data Logis dengan Tabel Fisik Aman',
      category: 'DATABASE DESIGN',
      summary: 'Organisasi DEMO_OPERATIONS_DB, DEMO_RECORDS_DB, dan RECONCILIATION_DB.',
      speakerNotes: 'Setiap tabel logis dipetakan ke tabel fisik SQLite yang aman, memastikan isolasi skema operasional dan data target settlement.',
      content: (
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-indigo-900/60 space-y-2">
            <div className="font-bold text-indigo-400 border-b border-slate-800 pb-1">DEMO_OPERATIONS_DB</div>
            <p className="text-[11px] text-slate-400">Tabel Sumber Operasional:</p>
            <ul className="text-[10px] text-slate-300 font-mono space-y-1">
              <li>• coffee_orders</li>
              <li>• bookstore_orders</li>
              <li>• ticket_bookings</li>
              <li>• warehouse_movements</li>
            </ul>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-teal-900/60 space-y-2">
            <div className="font-bold text-teal-400 border-b border-slate-800 pb-1">DEMO_RECORDS_DB</div>
            <p className="text-[11px] text-slate-400">Tabel Target Settlement:</p>
            <ul className="text-[10px] text-slate-300 font-mono space-y-1">
              <li>• coffee_payments</li>
              <li>• bookstore_sales</li>
              <li>• ticket_payments</li>
              <li>• inventory_records</li>
            </ul>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-amber-900/60 space-y-2">
            <div className="font-bold text-amber-400 border-b border-slate-800 pb-1">RECONCILIATION_DB</div>
            <p className="text-[11px] text-slate-400">Metadata & Audit Catalog:</p>
            <ul className="text-[10px] text-slate-300 font-mono space-y-1">
              <li>• _rms_databases / tables</li>
              <li>• _rms_modules / jobs</li>
              <li>• _rms_job_executions</li>
              <li>• _rms_reconciliation_results</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      number: 7,
      title: 'Template-Based Module Creation',
      subtitle: 'Onboarding Modul Bisnis Cepat Tanpa Menulis Kode',
      category: 'TEMPLATE FACTORY',
      summary: 'Menguraikan alur 1-klik provisioning modul dari input nama bisnis.',
      speakerNotes: 'Fitur template memungkinkan tim operasional memasukkan nama skenario baru, lalu sistem langsung men-generate kedua tabel, aturan pencocokan, job orkestrasi, dan data pengujian secara instan.',
      content: (
        <div className="space-y-3 text-xs">
          <p className="text-slate-300">
            Contoh: Pengguna memasukkan nama modul <strong className="text-white">"Bakery Orders"</strong> dan memilih template <strong className="text-white">Order-to-Payment</strong>.
          </p>
          <div className="grid grid-cols-5 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-bold text-teal-400 block">1. Input</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Nama & tipe template</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-bold text-indigo-400 block">2. Tabel Fisik</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Auto-create source & target</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-bold text-purple-400 block">3. Matching</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Mapping key & toleransi</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-bold text-amber-400 block">4. Job DAG</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Generate JOB_BAKERY_ORDERS</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-800/80">
              <span className="font-bold text-emerald-400 block">5. Siap Run</span>
              <span className="text-[10px] text-slate-400 mt-1 block">8 data sampel otomatis</span>
            </div>
          </div>
        </div>
      )
    },
    {
      number: 8,
      title: 'Reconciliation Engine Algorithm',
      subtitle: 'Alur Pemrosesan Deterministik 10 Tahap',
      category: 'ENGINE ALGORITHM',
      summary: 'Tahapan algoritma pencocokan 1:1 dan deteksi duplikasi.',
      speakerNotes: 'Algoritma membaca data dari tabel fisik, membentuk matching key, mengisolasi kunci duplikat ambigu, lalu melakukan evaluasi perbandingan nominal, tanggal, dan status secara berurutan.',
      content: (
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          {[
            '1. Validasi konfigurasi modul & JSON',
            '2. Verifikasi keberadaan tabel fisik di SQLite',
            '3. Memuat data tabel sumber ke memori',
            '4. Memuat data tabel target ke memori',
            '5. Normalisasi nilai & pembentukan key map',
            '6. Deteksi duplikasi kunci di sumber & target',
            '7. Isolasi & klasifikasi transaksi DUPLICATE',
            '8. Algoritma pencocokan 1:1 berurutan',
            '9. Evaluasi toleransi nominal, tanggal, & status',
            '10. Komit hasil ke _rms_reconciliation_results'
          ].map((st, idx) => (
            <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                {idx + 1}
              </span>
              <span className="text-slate-300 text-[11px] truncate">{st}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      number: 9,
      title: 'Matching Rules & Result Taxonomy',
      subtitle: 'Taksonomi Klasifikasi Hasil yang Ketat dan Deterministik',
      category: 'TAXONOMY',
      summary: 'Daftar 8 kode status klasifikasi hasil rekonsiliasi.',
      speakerNotes: 'Hasil rekonsiliasi tidak pernah ditebak secara stokastik. Seluruh transaksi dialokasikan ke salah satu dari 8 kode status yang memiliki kriteria evaluasi matematis pasti.',
      content: (
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800">
            <span className="font-bold text-emerald-400 block font-mono">MATCHED</span>
            <span className="text-[10px] text-slate-400 mt-1 block">100% selaras dalam toleransi</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800">
            <span className="font-bold text-amber-400 block font-mono">AMOUNT_MISMATCH</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Selisih nominal melebihi batas</span>
          </div>
          <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-800">
            <span className="font-bold text-sky-400 block font-mono">DATE_MISMATCH</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Perbedaan tanggal transaksi</span>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800">
            <span className="font-bold text-rose-400 block font-mono">STATUS_MISMATCH</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Status operasional berbeda</span>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-800">
            <span className="font-bold text-purple-400 block font-mono">SOURCE_ONLY</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Ada di sumber, hilang di target</span>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800">
            <span className="font-bold text-indigo-400 block font-mono">TARGET_ONLY</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Ada di target, tidak ada di sumber</span>
          </div>
          <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800">
            <span className="font-bold text-red-400 block font-mono">DUPLICATE</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Kunci ganda diisolasi</span>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700">
            <span className="font-bold text-zinc-300 block font-mono">PENDING</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Menunggu kliring settlement</span>
          </div>
        </div>
      )
    },
    {
      number: 10,
      title: 'Job Orchestration & Lifecycle',
      subtitle: 'Pelacakan Eksekusi, Log Tahapan, dan Idempotensi',
      category: 'JOB ORCHESTRATION',
      summary: 'Menguraikan proteksi concurrency lock, urutan eksekusi pipeline, dan log riwayat.',
      speakerNotes: 'Job menggabungkan modul menjadi alur kerja yang dapat dieksekusi secara berurutan, menerapkan concurrency lock agar tidak terjadi eksekusi ganda, dan mencatat log langkah demi langkah.',
      content: (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-bold text-indigo-400">Sequential Pipeline DAG</span>
              <p className="text-slate-400 text-[11px]">Eksekusi terurut: Extract Source -> Extract Target -> Execute Module -> Consolidate Stats -> Commit.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-bold text-teal-400">Concurrency Guard</span>
              <p className="text-slate-400 text-[11px]">Kunci memori runtime mencegah eksekusi ganda bersamaan pada job yang sama (HTTP 409).</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400">Step-by-Step Logging Stream</span>
            <p className="text-slate-400 text-[11px]">Setiap milestone mencatat timestamp, level [INFO, WARN, ERROR, SUCCESS], dan pesan ke tabel _rms_execution_logs.</p>
          </div>
        </div>
      )
    },
    {
      number: 11,
      title: 'Verified Example: Coffee Shop Sales',
      subtitle: 'Dataset Pengujian Nyata Rekonsiliasi Pesanan vs Gateway Kasir',
      category: 'CASE STUDY',
      summary: 'Menampilkan data uji 13 pesanan kopi vs 12 mutasi pembayaran.',
      speakerNotes: 'Dataset pengujian kopi dirancang deterministik untuk memperlihatkan seluruh skenario: cocok sempurna, selisih voucher nominal, perbedaan cut-off tanggal, status refund, dan entri kasir ganda.',
      content: (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
            <div className="p-3 rounded-lg bg-slate-950 border border-indigo-900/60">
              <span className="text-indigo-400 font-bold block mb-1">Source: coffee_orders (13 baris)</span>
              <ul className="text-slate-400 space-y-0.5 text-[10px]">
                <li>• CF-202610-001 (Rp 48.000) [COMPLETED]</li>
                <li>• CF-202610-005 (Rp 75.000) [COMPLETED]</li>
                <li>• CF-202610-006 (Rp 62.000, 2026-10-01)</li>
                <li>• CF-202610-007 (Rp 88.000) [COMPLETED]</li>
                <li>• CF-202610-009 (Rp 52.000, Duplicate Row A & B)</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-purple-900/60">
              <span className="text-purple-400 font-bold block mb-1">Target: coffee_payments (12 baris)</span>
              <ul className="text-slate-400 space-y-0.5 text-[10px]">
                <li>• CF-202610-001 (Rp 48.000) [COMPLETED]</li>
                <li>• CF-202610-005 (Rp 70.000, Selisih 5.000)</li>
                <li>• CF-202610-006 (Rp 62.000, 2026-10-02)</li>
                <li>• CF-202610-007 (Rp 88.000) [REFUNDED]</li>
                <li>• CF-202610-011 (Target Only payment)</li>
              </ul>
            </div>
          </div>
          <div className="p-2 rounded bg-slate-950 text-teal-400 font-mono text-[10px] text-center border border-slate-800">
            Matching Key: order_id = order_id • Toleransi Nominal: Rp 0.00 • Toleransi Tanggal: 0 Hari
          </div>
        </div>
      )
    },
    {
      number: 12,
      title: 'Actual Verification Results',
      subtitle: 'Hasil Eksekusi Nyata dari JOB_COFFEE_SALES_RECON',
      category: 'VERIFIED RESULTS',
      summary: 'Tabel hasil eksekusi aktual: 6 MATCHED, 1 AMOUNT DIFF, 1 DATE DIFF, 1 STATUS DIFF, 2 DUPLICATE, dll.',
      speakerNotes: 'Slide ini menampilkan hasil yang benar-benar dihitung oleh engine: 6 transaksi cocok 100%, 1 selisih nominal Rp 5.000, 1 selisih tanggal cut-off, dan 2 record terdeteksi duplikat.',
      content: (
        <div className="overflow-x-auto rounded-lg border border-slate-800 text-[10px] font-mono">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-2">Kunci Transaksi</th>
                <th className="p-2">Status Klasifikasi</th>
                <th className="p-2">Sumber vs Target</th>
                <th className="p-2">Diagnosa Sistem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
              <tr><td className="p-1.5 font-bold text-white">CF-202610-001</td><td className="p-1.5 text-emerald-400 font-bold">MATCHED</td><td className="p-1.5 text-slate-300">48.000 = 48.000</td><td className="p-1.5 text-slate-400">100% Cocok sempurna</td></tr>
              <tr><td className="p-1.5 font-bold text-white">CF-202610-005</td><td className="p-1.5 text-amber-400 font-bold">AMOUNT_MISMATCH</td><td className="p-1.5 text-slate-300">75.000 vs 70.000</td><td className="p-1.5 text-slate-400">Selisih nominal Rp 5.000</td></tr>
              <tr><td className="p-1.5 font-bold text-white">CF-202610-006</td><td className="p-1.5 text-sky-400 font-bold">DATE_MISMATCH</td><td className="p-1.5 text-slate-300">2026-10-01 vs 02</td><td className="p-1.5 text-slate-400">Perbedaan cut-off tanggal</td></tr>
              <tr><td className="p-1.5 font-bold text-white">CF-202610-007</td><td className="p-1.5 text-rose-400 font-bold">STATUS_MISMATCH</td><td className="p-1.5 text-slate-300">COMPLETED vs REFUND</td><td className="p-1.5 text-slate-400">Status transaksi tidak sinkron</td></tr>
              <tr><td className="p-1.5 font-bold text-white">CF-202610-009</td><td className="p-1.5 text-red-400 font-bold">DUPLICATE</td><td className="p-1.5 text-slate-300">2 baris di sumber</td><td className="p-1.5 text-slate-400">Kunci ganda ambigu diisolasi</td></tr>
            </tbody>
          </table>
        </div>
      )
    },
    {
      number: 13,
      title: 'Interactive User Walkthrough',
      subtitle: 'Panduan Operasional 10 Langkah Pengguna',
      category: 'USER WALKTHROUGH',
      summary: 'Langkah pengoperasian praktis dari dashboard hingga ekspor CSV.',
      speakerNotes: 'Setiap operator dapat menjalankan alur 10 langkah ini: periksa KPI di Dashboard, jelajahi tabel di Database Manager, buat modul template, jalankan job, dan inspeksi hasil side-by-side.',
      content: (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            '1. Buka Dashboard & tinjau kartu metrik KPI.',
            '2. Buka Database Manager untuk inspeksi skema fisik.',
            '3. Gunakan Table Designer jika ingin menambah tabel kustom.',
            '4. Jelajahi dan saring data transaksi di Data Explorer.',
            '5. Klik "Buat dari Template" untuk modul 1-klik.',
            '6. Tinjau batas toleransi pada Matching Rules.',
            '7. Buka Job Designer untuk memvisualisasikan workflow.',
            '8. Klik "Run Now" untuk eksekusi rekonsiliasi.',
            '9. Buka Reconciliation Results & inspeksi Side-by-Side.',
            '10. Ekspor laporan kepatuhan settlement ke format CSV.'
          ].map((dw, idx) => (
            <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
              {dw}
            </div>
          ))}
        </div>
      )
    },
    {
      number: 14,
      title: 'Technical Benefits & Architecture Value',
      subtitle: 'Kesiapan Enterprise, Idempotensi, dan Ekstensibilitas',
      category: 'VALUE PROPOSITION',
      summary: 'Zero hardcoding, keterulangan deterministik, dan kemudahan migrasi.',
      speakerNotes: 'Keunggulan teknis utama: mesin sepenuhnya independen dari skenario bisnis individu, tanpa dependensi server eksternal saat demo, dan kompatibel langsung dengan migrasi PostgreSQL.',
      content: (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-teal-900/60 space-y-1">
            <span className="font-bold text-teal-400">Zero Hardcoded Scenarios</span>
            <p className="text-slate-400 text-[11px]">Mesin rekonsiliasi sepenuhnya digerakkan oleh metadata katalog; penambahan modul tidak membutuhkan deploy kode baru.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-900/60 space-y-1">
            <span className="font-bold text-indigo-400">Deterministic Reproducibility</span>
            <p className="text-slate-400 text-[11px]">Bebas halusinasi probabilistik; 100% hasil matematis konsisten dengan jejak audit yang dapat diaudit regulator.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-900/60 space-y-1">
            <span className="font-bold text-purple-400">Zero External Setup</span>
            <p className="text-slate-400 text-[11px]">Langsung bekerja instan dalam browser container via SQLite WASM tanpa konfigurasi Docker tambahan.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-900/60 space-y-1">
            <span className="font-bold text-amber-400">PostgreSQL Migration Path</span>
            <p className="text-slate-400 text-[11px]">Struktur tabel dan DDL sepenuhnya kompatibel dengan migrasi masa depan ke Google Cloud SQL PostgreSQL.</p>
          </div>
        </div>
      )
    },
    {
      number: 15,
      title: 'Limitations & Production Roadmap',
      subtitle: 'Batasan Teknis Transparan dan Peta Pengembangan Masa Depan',
      category: 'ROADMAP',
      summary: 'Perbandingan transparan antara mode simulasi container saat ini dan arsitektur produksi.',
      speakerNotes: 'Kami menyajikan batasan teknis secara transparan: persistensi saat ini menggunakan buffer file SQLite lokal di container, dan penjadwalan otomatis produksi memerlukan Cloud Scheduler terdistribusi.',
      content: (
        <div className="overflow-x-auto rounded-lg border border-slate-800 text-[11px] font-mono">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-2">Dimensi Sistem</th>
                <th className="p-2">Mode Simulasi Saat Ini</th>
                <th className="p-2">Roadmap Skala Produksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
              <tr><td className="p-2 font-bold text-indigo-300">Penyimpanan Basis Data</td><td className="p-2 text-slate-400">File buffer SQLite WASM lokal</td><td className="p-2 text-teal-300">Managed Google Cloud SQL (PostgreSQL)</td></tr>
              <tr><td className="p-2 font-bold text-indigo-300">Durable Scheduler</td><td className="p-2 text-slate-400">In-process best-effort timer</td><td className="p-2 text-teal-300">Google Cloud Scheduler & Cloud Tasks</td></tr>
              <tr><td className="p-2 font-bold text-indigo-300">Otentikasi & Akses</td><td className="p-2 text-slate-400">Open simulation (tanpa login)</td><td className="p-2 text-teal-300">Firebase Auth / OAuth 2.0 RBAC Roles</td></tr>
              <tr><td className="p-2 font-bold text-indigo-300">Volume Skala Data</td><td className="p-2 text-slate-400">Hingga puluhan ribu record memori</td><td className="p-2 text-teal-300">Streaming chunked ETL distributed workers</td></tr>
            </tbody>
          </table>
        </div>
      )
    },
    {
      number: 16,
      title: 'Conclusion & Q&A',
      subtitle: 'Configure. Execute. Reconcile. Analyze.',
      category: 'CONCLUSION',
      summary: 'Slide penutup resmi dan sesi tanya jawab teknis.',
      speakerNotes: 'Terima kasih atas perhatian rekan-rekan sekalian. Reconciliation Studio siap digunakan sebagai fondasi verifikasi rekonsiliasi data. Kami membuka sesi tanya jawab untuk mendiskusikan arsitektur dan implementasinya.',
      content: (
        <div className="h-full flex flex-col justify-center items-center text-center p-8 bg-slate-950 rounded-xl border border-slate-800">
          <div className="text-2xl font-bold text-indigo-400 font-mono tracking-wide">
            Configure. Execute. Reconcile. Analyze.
          </div>
          <p className="text-slate-300 text-xs max-w-lg mt-3 leading-relaxed">
            Reconciliation Studio menghadirkan platform deterministik, transparan, dan siap pakai untuk rekonsiliasi data enterprise, settlement audit, dan orkestrasi job.
          </p>
          <div className="mt-6 text-xl font-bold text-white">
            Terima Kasih! Sesi Tanya Jawab (Q&A)
          </div>
          <div className="mt-4 text-[11px] text-slate-500 font-mono">
            Reconciliation Studio v2.5 Enterprise Simulator • Live di Google AI Studio
          </div>
        </div>
      )
    }
  ];

  const currentSlideData = slides[currentSlide - 1];

  const handleDownloadPptx = async () => {
    setDownloading(true);
    try {
      window.open('/api/presentation/download', '_blank');
      setAlertMsg('Mengunduh file Reconciliation_Studio_Presentation.pptx...');
      setTimeout(() => setAlertMsg(null), 4000);
    } catch (err: any) {
      alert('Gagal mengunduh presentasi: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleRegeneratePptx = async () => {
    setRegenerating(true);
    try {
      const res = await fetch('/api/presentation/generate', { method: 'POST' });
      const data = await res.json();
      setAlertMsg(data.message || 'File presentasi berhasil digenerate ulang!');
      setTimeout(() => setAlertMsg(null), 4000);
    } catch (err: any) {
      alert('Gagal me-regenerate presentasi: ' + err.message);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Presentations & Executive Deck</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              16:9 Widescreen PPTX
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pratayang slide deck eksekutif 16 halaman dan unduh file presentasi PowerPoint (.pptx) asli yang dapat diedit
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRegeneratePptx}
            disabled={regenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            <span>{regenerating ? 'Membuat Ulang...' : 'Regenerate PPTX'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF</span>
          </button>

          <button
            onClick={handleDownloadPptx}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-900/30 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PowerPoint (.pptx)</span>
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Main Slide Presentation Canvas */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        {/* Slide Top Navigation */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Slide {currentSlide} dari {slides.length}</span>
            <span className="text-slate-600">|</span>
            <span className="text-indigo-400 font-bold uppercase">{currentSlideData.category}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                showSpeakerNotes
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              <span>{showSpeakerNotes ? 'Sembunyikan Speaker Notes' : 'Tampilkan Speaker Notes'}</span>
            </button>

            <button
              onClick={() => setCurrentSlide(Math.max(1, currentSlide - 1))}
              disabled={currentSlide <= 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentSlide(Math.min(slides.length, currentSlide + 1))}
              disabled={currentSlide >= slides.length}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 16:9 Slide Frame */}
        <div className="p-6 md:p-8 bg-slate-900 min-h-[380px] flex flex-col justify-between">
          <div>
            <div className="mb-4 pb-2 border-b border-slate-800/80">
              <h3 className="text-lg font-bold text-white tracking-tight">{currentSlideData.title}</h3>
              <p className="text-xs text-teal-400 mt-0.5">{currentSlideData.subtitle}</p>
            </div>

            <div className="min-h-[220px]">
              {currentSlideData.content}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Reconciliation Studio — Technical Architecture & Overview</span>
            <span>Slide {currentSlide} / {slides.length}</span>
          </div>
        </div>

        {/* Speaker Notes Drawer */}
        {showSpeakerNotes && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Speaker Notes (Panduan Penyampaian Presenter)</span>
            </div>
            <p className="text-slate-300 italic font-sans leading-relaxed">
              "{currentSlideData.speakerNotes}"
            </p>
          </div>
        )}
      </div>

      {/* Slide Thumbnail Strip */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          Navigasi Thumbnail Slide (16 Slide)
        </span>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {slides.map((s) => (
            <button
              key={s.number}
              onClick={() => setCurrentSlide(s.number)}
              className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                currentSlide === s.number
                  ? 'bg-indigo-950/60 border-indigo-500 text-white font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] font-mono text-indigo-400">Slide {s.number}</div>
              <div className="text-[11px] truncate mt-0.5">{s.title}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
