# 10. Troubleshooting Guide

This guide provides diagnostic procedures and resolutions for common issues encountered during the development, configuration, and execution of Reconciliation Studio.

---

## 1. Application & Server Issues

### 1.1 Application Fails to Start
- **Symptom:** Terminal exits with an error or fails to bind to port 3000.
- **Possible Causes:**
  - Another process is occupying port 3000.
  - Node version is older than v20.
- **Resolution:**
  - Ensure Node.js v20+ or v22+ is installed: `node -v`.
  - Kill any process occupying port 3000: `fuser -k 3000/tcp` or `kill -9 $(lsof -t -i:3000)`.
  - Restart the development server: `npm run dev`.

### 1.2 SQLite Initialization Failure
- **Symptom:** Error `Gagal memuat database file yang ada, membuat database baru`.
- **Diagnostic:** Check if `./data/rms_database.sqlite` is corrupted or has uncommitted write locks.
- **Resolution:**
  - Delete `./data/rms_database.sqlite` to let the system re-initialize a fresh catalog.
  - Click the **Reset DB** button in the top navigation bar to re-seed demo datasets.

---

## 2. Reconciliation & Job Execution Issues

### 2.1 Job Fails with `"Job ... sedang berjalan saat ini"`
- **Symptom:** Triggering a job returns HTTP 409 conflict.
- **Cause:** Concurrency protection lock in `jobOrchestrator.ts` is active because a previous run is still processing or terminated abruptly.
- **Resolution:**
  - Wait 5 seconds for execution completion.
  - If stuck, restart the Node.js server to clear the in-memory `activeRunningJobs` set.

### 2.2 Matching Rate is 0% (All Transcations Unmatched)
- **Symptom:** The job completes with `PARTIAL_SUCCESS` but 0 records are classified as `MATCHED`.
- **Diagnostic:**
  - Check `matchingFields` in the module configuration.
  - Inspect the values of the key column in both source and target using **Data Explorer**.
- **Common Cause:** Leading or trailing spaces, uppercase vs lowercase mismatch, or mismatched key field names (e.g., mapping `order_id` to `id` instead of `order_id`).
- **Resolution:**
  - Open **Reconciliation Modules**, review the key mapping, and ensure both tables contain shared identifier values.

### 2.3 Mismatched Record Classifications
- **Symptom:** A record with identical amounts is classified as `AMOUNT_MISMATCH`.
- **Cause:** String formatting or currency symbols stored inside numeric fields (e.g., `"Rp 50.000"` instead of `50000.00`).
- **Resolution:**
  - Ensure numeric columns use `DECIMAL` or clean numeric string values. The engine automatically strips non-numeric characters, but proper float syntax ensures exact precision.

---

## 3. Data Import & DDL Issues

### 3.1 CSV Import Skips Rows
- **Symptom:** Only a subset of CSV rows are imported into the table.
- **Cause:** Header column names in the CSV do not match column names defined in the table schema.
- **Resolution:**
  - Ensure the first row of your CSV file contains lowercase headers matching the table columns exactly (e.g., `id,order_id,order_date,order_amount`).

### 3.2 Dynamic Table Creation Rejected
- **Symptom:** API returns HTTP 400 error when clicking "Buat Tabel Sekarang".
- **Cause:** Table name contains spaces or special characters, or table already exists in that database.
- **Resolution:**
  - Use lowercase alphanumeric characters and underscores only (e.g., `pos_transactions`).
