# 08. Step-by-Step Practical Examples

This document provides three complete, end-to-end practical tutorials demonstrating the capabilities of Reconciliation Studio.

---

## Example 1: Coffee Shop Sales Reconciliation (Verified Test Case)

### 1.1 Objective
Reconcile POS orders recorded at a coffee shop cash register against incoming settlement records from a QRIS/EDC payment gateway.

### 1.2 Data Setup
- **Source Database:** `DEMO_OPERATIONS_DB`  
  **Table:** `coffee_orders` (Columns: `id`, `order_id`, `order_date`, `order_amount`, `customer_name`, `channel`, `order_status`)
- **Target Database:** `DEMO_RECORDS_DB`  
  **Table:** `coffee_payments` (Columns: `id`, `order_id`, `payment_date`, `paid_amount`, `payment_method`, `payment_status`)

#### Sample Source Data
| order_id | order_date | order_amount | customer_name | order_status |
|---|---|---|---|---|
| `CF-202610-001` | 2026-10-01 | Rp 48.000 | Budi Santoso | COMPLETED |
| `CF-202610-005` | 2026-10-01 | Rp 75.000 | Rudi Hermawan | COMPLETED |
| `CF-202610-006` | 2026-10-01 | Rp 62.000 | Fitri Handayani | COMPLETED |
| `CF-202610-007` | 2026-10-01 | Rp 88.000 | Hendra Gunawan | COMPLETED |
| `CF-202610-008` | 2026-10-01 | Rp 40.000 | Maya Putri | PENDING |
| `CF-202610-009` | 2026-10-01 | Rp 52.000 | Arif Prasetyo (Row A) | COMPLETED |
| `CF-202610-009` | 2026-10-01 | Rp 52.000 | Arif Prasetyo (Row B) | COMPLETED |
| `CF-202610-010` | 2026-10-01 | Rp 95.000 | Lia Anggraini | COMPLETED |

#### Sample Target Data
| order_id | payment_date | paid_amount | payment_method | payment_status |
|---|---|---|---|---|
| `CF-202610-001` | 2026-10-01 | Rp 48.000 | QRIS | COMPLETED |
| `CF-202610-005` | 2026-10-01 | Rp 70.000 | QRIS | COMPLETED |
| `CF-202610-006` | 2026-10-02 | Rp 62.000 | QRIS | COMPLETED |
| `CF-202610-007` | 2026-10-01 | Rp 88.000 | EDC_CREDIT | REFUNDED |
| `CF-202610-008` | 2026-10-01 | Rp 40.000 | E_WALLET | PENDING |
| `CF-202610-009` | 2026-10-01 | Rp 52.000 | CASH | COMPLETED |
| `CF-202610-011` | 2026-10-01 | Rp 45.000 | EDC_DEBIT | COMPLETED |

### 1.3 Execution Configuration
- **Module:** `COFFEE_SALES_RECON`
- **Job:** `JOB_COFFEE_SALES_RECON`
- **Matching Key:** `order_id = order_id`
- **Attribute Comparisons:**
  - `order_amount = paid_amount` (AMOUNT, tolerance: 0.00)
  - `order_date = payment_date` (DATE, toleranceDays: 0)
  - `order_status = payment_status` (STATUS)

### 1.4 Actual Runtime Verification Results
| Reference Key | Reconciliation Status | Diagnostic Reason |
|---|---|---|
| `CF-202610-001` | **MATCHED** | Transaksi cocok sempurna (100% Match pada nominal, tanggal, status) |
| `CF-202610-005` | **AMOUNT_MISMATCH** | Selisih nominal: Rp 75.000 vs Rp 70.000 (Selisih: Rp 5.000) |
| `CF-202610-006` | **DATE_MISMATCH** | Perbedaan tanggal transaksi: 2026-10-01 vs 2026-10-02 |
| `CF-202610-007` | **STATUS_MISMATCH** | Status transaksi tidak selaras: COMPLETED vs REFUNDED |
| `CF-202610-008` | **PENDING** | Status transaksi masih menunggu konfirmasi settlement (PENDING) |
| `CF-202610-009` | **DUPLICATE** | Duplikasi kunci pada data sumber (2 record ditemukan dengan key) |
| `CF-202610-010` | **SOURCE_ONLY** | Catatan tercatat pada sumber namun tidak ditemukan pada target |
| `CF-202610-011` | **TARGET_ONLY** | Catatan terdapat pada target namun tidak ditemukan pada sumber |

---

## Example 2: Creating a New Module from Template (Bakery Orders)

### 2.1 Scenario
An operations team needs to set up a new daily audit pipeline for `"Bakery Orders"`.

### 2.2 Execution Steps
1. Navigate to **Reconciliation Modules**.
2. Click **"Buat dari Template (1-Klik)"**.
3. In the modal:
   - Module Name: `Bakery Orders`
   - Template Pattern: `Order-to-Payment (Pencocokan Pesanan vs Pembayaran)`
   - Checked: `Generate data sampel sintetis`
4. Click **"Generate & Aktifkan Modul"**.

### 2.3 System Output Verification
The backend automatically executes the following actions within 500ms:
- **Module Code Created:** `BAKERY_ORDERS_RECON`
- **Source Table Provisioned:** `DEMO_OPERATIONS_DB.bakery_orders_source` with columns `id`, `order_id`, `order_date`, `order_amount`, `customer_name`, `status`.
- **Target Table Provisioned:** `DEMO_RECORDS_DB.bakery_orders_target` with columns `id`, `order_id`, `payment_date`, `paid_amount`, `payment_method`, `status`.
- **Job Created:** `JOB_BAKERY_ORDERS_RECON`.
- **Synthetic Records Inserted:** 8 realistic records containing exact matches and sample deviations.
- **Execution Test:** Navigate to **Job Designer**, select `JOB_BAKERY_ORDERS_RECON`, and click **Run Now**. The job immediately succeeds with verifiable output.

---

## Example 3: Custom Reconciliation with Divergent Column Schemas

### 3.1 Scenario
Reconcile an existing delivery orders table (`delivery_orders`) against third-party courier delivery confirmations (`delivery_confirmations`), where field names do not match.

### 3.2 Schema Mapping
- Source Table: `delivery_orders`
  - Field `order_reference` -> Target Field `delivery_reference` (MATCHING KEY)
  - Field `quantity` -> Target Field `delivered_quantity` (AMOUNT comparison, tolerance 0)
  - Field `dispatch_date` -> Target Field `delivered_date` (DATE comparison, toleranceDays 1)

### 3.3 Setup via Wizard
1. Open **Reconciliation Modules** -> Click **Kustom Wizard**.
2. Select Source Database: `DEMO_OPERATIONS_DB`, Table: `delivery_orders`.
3. Select Target Database: `DEMO_RECORDS_DB`, Table: `delivery_confirmations`.
4. Enter Source Matching Field: `order_reference`.
5. Enter Target Matching Field: `delivery_reference`.
6. Click **Simpan Modul**.
7. Attach the new module to a job in **Job Designer** and click **Run Now** to reconcile.
