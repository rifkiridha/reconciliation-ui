# 07. User Guide & Operating Manual

**Platform:** Reconciliation Studio  
**Target Users:** Business Analysts, QA Testers, Operations Officers, System Integrators  
**UI Language:** Indonesian (with standard English terminology)  

---

## 1. Overview & Navigation Layout

Reconciliation Studio features a responsive left-sidebar navigation split into five logical sections:
- **DATA MANAGEMENT:** Dashboard, Database Manager, Table Designer, Data Explorer
- **ENGINE CONFIGURATION:** Reconciliation Modules, Matching Rules
- **ORCHESTRATION:** Job Designer, Job Scheduler
- **MONITORING:** Execution History, Reconciliation Results
- **AUDIT & COMPLIANCE:** Reports & Export, Audit Logs, Presentations, Documentation, Settings

---

## 2. Step-by-Step Operations

### 2.1 Viewing System Status on Dashboard
1. Klik menu **Dashboard** di sidebar kiri.
2. Periksa kartu KPI utama:
   - **Matching Rate Terakhir:** Persentase transaksi yang cocok sempurna (100% Match).
   - **Pengecualian / Selisih:** Jumlah transaksi yang membutuhkan peninjauan manual.
   - **Net Selisih Finansial:** Total selisih nominal antara sistem sumber dan target.
3. Klik tombol **"Jalankan Job Harian"** di pojok kanan atas untuk mengeksekusi rekonsiliasi seketika.

### 2.2 Mengelola Database & Menjalankan Kueri SQL
1. Buka **Database Manager**.
2. Di panel kiri, klik salah satu basis data (misal: `DEMO_OPERATIONS_DB`).
3. Pilih tabel untuk melihat daftar kolom, tipe data, status primary key, dan jumlah baris.
4. Di panel bawah **SQL Query Runner (Read-Only)**, ketik kueri SQL:
   ```sql
   SELECT * FROM tbl_DEMO_OPERATIONS_DB_coffee_orders LIMIT 10;
   ```
5. Klik **Jalankan Query** untuk melihat hasil seketika di tabel interaktif.

### 2.3 Merancang Tabel Baru di Table Designer
1. Buka **Table Designer**.
2. Pilih database tujuan (misal: `DEMO_OPERATIONS_DB`).
3. Masukkan nama tabel dalam huruf kecil (misal: `delivery_manifest`).
4. Klik **Tambah Kolom** untuk menambahkan atribut baru.
5. Pilih tipe data: `UUID`, `VARCHAR`, `DECIMAL`, `DATE`, `INTEGER`, atau `BOOLEAN`.
6. Klik **Preview SQL DDL** untuk memeriksa DDL fisik yang akan dieksekusi.
7. Klik **Buat Tabel Sekarang**. Tabel fisik langsung tercipta di SQLite.

### 2.4 Menjelajah & Mengedit Data di Data Explorer
1. Buka **Data Explorer**.
2. Pilih Database dan Tabel yang ingin diinspeksi.
3. Gunakan kolom pencarian di pojok kanan untuk memfilter berdasarkan referensi transaksi.
4. Klik **Tambah Record** untuk memasukkan baris baru secara manual.
5. Klik tombol **+ 5 Sampel Data** untuk men-generate data uji acak realistis.
6. Klik **Ekspor CSV** untuk mengunduh seluruh baris ke spreadsheet.

### 2.5 Membuat Modul Baru dari Template (1-Klik)
1. Buka **Reconciliation Modules**.
2. Klik tombol gradien **"Buat dari Template (1-Klik)"**.
3. Masukkan nama bisnis (misal: `"Restaurant Orders"` atau `"Hospital Pharmacy"`).
4. Pilih pola template:
   - `Order-to-Payment`: Pencocokan pesanan POS vs pembayaran kasir.
   - `Two-Source Transaction`: Pencocokan transaksi POS vs mitra switching.
   - `Inventory Stock Audit`: Audit stok logistik vs stock opname fisik.
5. Centang opsi **"Generate data sampel sintetis"**.
6. Klik **Generate & Aktifkan Modul**.
7. Sistem langsung membuat tabel sumber, tabel target, aturan matching, job orkestrasi, dan data sampel.

### 2.6 Menjalankan Job Rekonsiliasi di Job Designer
1. Buka **Job Designer**.
2. Pilih job dari daftar di sebelah kiri (misal: `JOB_COFFEE_SALES_RECON`).
3. Periksa diagram pipeline alur eksekusi (START -> EXTRACT -> RECONCILE -> COMMIT -> END).
4. Klik tombol hijau **"Jalankan Job Ini"** (atau **Run Now**).
5. Sistem mengunci eksekusi, menjalankan perbandingan, dan menampilkan status `SUCCESS` atau `PARTIAL_SUCCESS`.

### 2.7 Memeriksa Selisih Transaksi di Reconciliation Results
1. Buka **Reconciliation Results**.
2. Pilih eksekusi dari dropdown di atas.
3. Gunakan filter tab status:
   - `MATCHED` untuk transaksi cocok.
   - `AMOUNT_MISMATCH` untuk transaksi dengan selisih nominal.
   - `DATE_MISMATCH` untuk perbedaan tanggal transaksi.
   - `DUPLICATE` untuk transaksi ganda.
4. Klik ikon mata (**Detail**) di ujung kanan baris untuk membuka modal **Side-by-Side Comparison**:
   - Kolom kiri menampilkan data sumber operasional.
   - Kolom kanan menampilkan data target settlement.
   - Nilai selisih dan alasan sistem disajikan secara transparan.

### 2.8 Mengunduh Presentasi PowerPoint
1. Buka menu **Presentations** di sidebar.
2. Tinjau pratayang 16 slide presentasi eksekutif.
3. Klik **Download PowerPoint (.pptx)** untuk mengunduh slide presentasi resmi yang dapat diedit langsung di Microsoft PowerPoint atau Google Slides.

---

## 3. Kesalahan Umum & Solusi (Troubleshooting Tips)

| Masalah | Penyebab | Solusi |
|---|---|---|
| Tabel fisik tidak ditemukan saat rekonsiliasi | Tabel sumber/target belum dibuat di database fisik | Gunakan Table Designer atau gunakan fitur "Buat dari Template" |
| Hasil matching 0% rate | Kolom matching key salah dikonfigurasi | Periksa konfigurasi `matchingFields` di Reconciliation Modules |
| Job berstatus FAILED karena concurrency | Job yang sama sedang berjalan | Tunggu beberapa detik hingga run sebelumnya selesai |
| Data hilang setelah container restart | Menggunakan temporary sandbox storage | Klik tombol **Reset DB** di navbar untuk memuat ulang data demo |
