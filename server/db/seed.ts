import { SqlJsDatabase } from 'sql.js';
import { executeSql, generatePhysicalTableName, queryOne, addAuditLog } from './database.js';

export function seedInitialData(db: SqlJsDatabase, forceReset: boolean = false): void {
  // Check if DEMO_OPERATIONS_DB exists
  const existingOps = queryOne(db, `SELECT id FROM _rms_databases WHERE name = ?`, ['DEMO_OPERATIONS_DB']);
  if (existingOps && !forceReset) {
    console.log('[SEED] Basis data skenario bisnis sudah terinisialisasi. Melewati seeding.');
    return;
  }

  console.log('[SEED] Menginisialisasi basis data skenario bisnis dan modul rekonsiliasi...');

  const now = new Date().toISOString();

  if (forceReset || existingOps) {
    // Drop all registered tables
    try {
      const allTables = db.exec(`SELECT physical_table_name FROM _rms_tables;`);
      if (allTables.length > 0 && allTables[0].values) {
        for (const row of allTables[0].values) {
          const tblName = row[0];
          db.run(`DROP TABLE IF EXISTS "${tblName}";`);
        }
      }
      db.run(`DELETE FROM _rms_columns;`);
      db.run(`DELETE FROM _rms_tables;`);
      db.run(`DELETE FROM _rms_databases;`);
      db.run(`DELETE FROM _rms_modules;`);
      db.run(`DELETE FROM _rms_jobs;`);
      db.run(`DELETE FROM _rms_job_schedules;`);
      db.run(`DELETE FROM _rms_matching_rules;`);
      db.run(`DELETE FROM _rms_reconciliation_results;`);
      db.run(`DELETE FROM _rms_job_executions;`);
      db.run(`DELETE FROM _rms_execution_logs;`);
    } catch (e) {
      console.warn('[SEED] Peringatan saat pembersihan tabel:', e);
    }
  }

  // 1. Create Logical Databases
  const dbOpsId = 'db-operations';
  const dbRecsId = 'db-records';
  const dbReconId = 'db-reconciliation';

  executeSql(db, `INSERT OR REPLACE INTO _rms_databases (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [dbOpsId, 'DEMO_OPERATIONS_DB', 'Operational source transactions: Coffee Orders, Bookstore Orders, Ticket Bookings, Warehouse Movements', now, now]);
  executeSql(db, `INSERT OR REPLACE INTO _rms_databases (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [dbRecsId, 'DEMO_RECORDS_DB', 'Settlement and verification records: Payment Gateways, Sales Ledgers, Inventory Counts', now, now]);
  executeSql(db, `INSERT OR REPLACE INTO _rms_databases (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [dbReconId, 'RECONCILIATION_DB', 'Reconciliation metadata catalog, matching configuration, and execution results', now, now]);

  // Helper to register table and columns
  const registerTableAndColumns = (
    dbId: string,
    dbName: string,
    tableId: string,
    tableName: string,
    description: string,
    columns: { name: string; type: string; isPk?: number; isNull?: number; maxLen?: number; defaultVal?: string }[]
  ) => {
    const physName = generatePhysicalTableName(dbName, tableName);

    // Build SQLite CREATE TABLE
    const colDefs = columns.map(c => {
      let sqlType = 'TEXT';
      if (c.type === 'INTEGER' || c.type === 'BIGINT') sqlType = 'INTEGER';
      else if (c.type === 'DECIMAL' || c.type === 'NUMERIC') sqlType = 'REAL';
      return `"${c.name}" ${sqlType} ${c.isPk ? 'PRIMARY KEY' : ''} ${c.isNull === 0 && !c.isPk ? 'NOT NULL' : ''}`;
    });

    db.run(`DROP TABLE IF EXISTS "${physName}";`);
    db.run(`CREATE TABLE "${physName}" (${colDefs.join(', ')});`);

    executeSql(db, `INSERT OR REPLACE INTO _rms_tables (id, database_id, database_name, table_name, physical_table_name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tableId, dbId, dbName, tableName, physName, description, now, now]);

    columns.forEach((col, idx) => {
      executeSql(db, `INSERT OR REPLACE INTO _rms_columns (id, table_id, column_name, data_type, max_length, is_nullable, is_primary_key, is_unique, default_value, ordinal_position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [`col-${tableId}-${col.name}`, tableId, col.name, col.type, col.maxLen || null, col.isNull ?? 1, col.isPk ?? 0, col.isPk ?? 0, col.defaultVal || null, idx + 1]);
    });

    return physName;
  };

  // ========================================================
  // SCENARIO 1: COFFEE SHOP SALES RECONCILIATION
  // ========================================================
  const physCoffeeOrders = registerTableAndColumns(dbOpsId, 'DEMO_OPERATIONS_DB', 'tbl-coffee-orders', 'coffee_orders', 'Data pesanan minuman dan makanan dari POS Kasir Coffee Shop', [
    { name: 'id', type: 'UUID', isPk: 1 },
    { name: 'order_id', type: 'VARCHAR', isNull: 0, maxLen: 50 },
    { name: 'order_date', type: 'DATE', isNull: 0 },
    { name: 'order_amount', type: 'DECIMAL', isNull: 0 },
    { name: 'customer_name', type: 'VARCHAR', isNull: 0, maxLen: 100 },
    { name: 'channel', type: 'VARCHAR', isNull: 0, maxLen: 50 },
    { name: 'order_status', type: 'VARCHAR', isNull: 0, maxLen: 20 }
  ]);

  const physCoffeePayments = registerTableAndColumns(dbRecsId, 'DEMO_RECORDS_DB', 'tbl-coffee-payments', 'coffee_payments', 'Data catatan penerimaan pembayaran QRIS, Tunai, dan Mesin EDC', [
    { name: 'id', type: 'UUID', isPk: 1 },
    { name: 'order_id', type: 'VARCHAR', isNull: 0, maxLen: 50 },
    { name: 'payment_date', type: 'DATE', isNull: 0 },
    { name: 'paid_amount', type: 'DECIMAL', isNull: 0 },
    { name: 'payment_method', type: 'VARCHAR', isNull: 0, maxLen: 50 },
    { name: 'payment_status', type: 'VARCHAR', isNull: 0, maxLen: 20 }
  ]);

  // Insert Coffee Data (>= 12 records, deterministic mismatch scenarios)
  const coffeeOrdersData = [
    { id: 'ORD-01', order_id: 'CF-202610-001', date: '2026-10-01', amount: 48000.00, customer: 'Budi Santoso', channel: 'DINE_IN', status: 'COMPLETED' },
    { id: 'ORD-02', order_id: 'CF-202610-002', date: '2026-10-01', amount: 35000.00, customer: 'Siti Rahma', channel: 'TAKEAWAY', status: 'COMPLETED' },
    { id: 'ORD-03', order_id: 'CF-202610-003', date: '2026-10-01', amount: 120000.00, customer: 'Andi Wijaya', channel: 'DRIVE_THRU', status: 'COMPLETED' },
    { id: 'ORD-04', order_id: 'CF-202610-004', date: '2026-10-01', amount: 55000.00, customer: 'Dewi Lestari', channel: 'MOBILE_APP', status: 'COMPLETED' },
    // 5. Amount mismatch: order 75.000 vs payment 70.000 (voucher diskon tidak tercatat di gateway)
    { id: 'ORD-05', order_id: 'CF-202610-005', date: '2026-10-01', amount: 75000.00, customer: 'Rudi Hermawan', channel: 'DINE_IN', status: 'COMPLETED' },
    // 6. Date mismatch: order 2026-10-01 vs settlement 2026-10-02
    { id: 'ORD-06', order_id: 'CF-202610-006', date: '2026-10-01', amount: 62000.00, customer: 'Fitri Handayani', channel: 'DINE_IN', status: 'COMPLETED' },
    // 7. Status mismatch: order COMPLETED vs payment VOID/REFUNDED
    { id: 'ORD-07', order_id: 'CF-202610-007', date: '2026-10-01', amount: 88000.00, customer: 'Hendra Gunawan', channel: 'TAKEAWAY', status: 'COMPLETED' },
    // 8. Pending payment
    { id: 'ORD-08', order_id: 'CF-202610-008', date: '2026-10-01', amount: 40000.00, customer: 'Maya Putri', channel: 'MOBILE_APP', status: 'PENDING' },
    // 9 & 10. Duplicate order attempt
    { id: 'ORD-09A', order_id: 'CF-202610-009', date: '2026-10-01', amount: 52000.00, customer: 'Arif Prasetyo', channel: 'DINE_IN', status: 'COMPLETED' },
    { id: 'ORD-09B', order_id: 'CF-202610-009', date: '2026-10-01', amount: 52000.00, customer: 'Arif Prasetyo', channel: 'DINE_IN', status: 'COMPLETED' },
    // 11. Source only (unpaid order abandoned at kiosk)
    { id: 'ORD-10', order_id: 'CF-202610-010', date: '2026-10-01', amount: 95000.00, customer: 'Lia Anggraini', channel: 'KIOSK', status: 'COMPLETED' },
    // 12-13. Extra exact matches
    { id: 'ORD-12', order_id: 'CF-202610-012', date: '2026-10-01', amount: 32000.00, customer: 'Doni Firmansyah', channel: 'TAKEAWAY', status: 'COMPLETED' },
    { id: 'ORD-13', order_id: 'CF-202610-013', date: '2026-10-01', amount: 64000.00, customer: 'Intan Permata', channel: 'DINE_IN', status: 'COMPLETED' }
  ];

  for (const o of coffeeOrdersData) {
    executeSql(db, `INSERT INTO "${physCoffeeOrders}" (id, order_id, order_date, order_amount, customer_name, channel, order_status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [o.id, o.order_id, o.date, o.amount, o.customer, o.channel, o.status]);
  }

  const coffeePaymentsData = [
    { id: 'PAY-01', order_id: 'CF-202610-001', date: '2026-10-01', amount: 48000.00, method: 'QRIS', status: 'COMPLETED' },
    { id: 'PAY-02', order_id: 'CF-202610-002', date: '2026-10-01', amount: 35000.00, method: 'CASH', status: 'COMPLETED' },
    { id: 'PAY-03', order_id: 'CF-202610-003', date: '2026-10-01', amount: 120000.00, method: 'EDC_DEBIT', status: 'COMPLETED' },
    { id: 'PAY-04', order_id: 'CF-202610-004', date: '2026-10-01', amount: 55000.00, method: 'E_WALLET', status: 'COMPLETED' },
    // 5. Amount mismatch (70.000 vs 75.000)
    { id: 'PAY-05', order_id: 'CF-202610-005', date: '2026-10-01', amount: 70000.00, method: 'QRIS', status: 'COMPLETED' },
    // 6. Date mismatch (2026-10-02 vs 2026-10-01)
    { id: 'PAY-06', order_id: 'CF-202610-006', date: '2026-10-02', amount: 62000.00, method: 'QRIS', status: 'COMPLETED' },
    // 7. Status mismatch (REFUNDED vs COMPLETED)
    { id: 'PAY-07', order_id: 'CF-202610-007', date: '2026-10-01', amount: 88000.00, method: 'EDC_CREDIT', status: 'REFUNDED' },
    // 8. Pending
    { id: 'PAY-08', order_id: 'CF-202610-008', date: '2026-10-01', amount: 40000.00, method: 'E_WALLET', status: 'PENDING' },
    // 9. One candidate for duplicate key
    { id: 'PAY-09', order_id: 'CF-202610-009', date: '2026-10-01', amount: 52000.00, method: 'CASH', status: 'COMPLETED' },
    // 10. Target only payment (manual EDC swipe without order linkage)
    { id: 'PAY-11', order_id: 'CF-202610-011', date: '2026-10-01', amount: 45000.00, method: 'EDC_DEBIT', status: 'COMPLETED' },
    // 11-12. Exact matches
    { id: 'PAY-12', order_id: 'CF-202610-012', date: '2026-10-01', amount: 32000.00, method: 'CASH', status: 'COMPLETED' },
    { id: 'PAY-13', order_id: 'CF-202610-013', date: '2026-10-01', amount: 64000.00, method: 'QRIS', status: 'COMPLETED' }
  ];

  for (const p of coffeePaymentsData) {
    executeSql(db, `INSERT INTO "${physCoffeePayments}" (id, order_id, payment_date, paid_amount, payment_method, payment_status) VALUES (?, ?, ?, ?, ?, ?)`,
      [p.id, p.order_id, p.date, p.amount, p.method, p.status]);
  }

  // ========================================================
  // SCENARIO 2: BOOKSTORE ORDERS RECONCILIATION
  // ========================================================
  const physBookOrders = registerTableAndColumns(dbOpsId, 'DEMO_OPERATIONS_DB', 'tbl-book-orders', 'bookstore_orders', 'Data pesanan buku cetak dan digital dari platform Toko Buku', [
    { name: 'id', type: 'UUID', isPk: 1 },
    { name: 'order_reference', type: 'VARCHAR', isNull: 0, maxLen: 50 },
    { name: 'order_date', type: 'DATE', isNull: 0 },
    { name: 'order_total', type: 'DECIMAL', isNull: 0 },
    { name: 'items_count', type: 'INTEGER', isNull: 0 },
    { name: 'status', type: 'VARCHAR', isNull: 0, maxLen: 20 }
  ]);

  const physBookSales = registerTableAndColumns(dbRecsId, 'DEMO_RECORDS_DB', 'tbl-book-sales', 'bookstore_sales', 'Catatan pembukuan penjualan kasir dan ringkasan settlement', [
    { name: 'id', type: 'UUID', isPk: 1 },
    { name: 'order_reference', type: 'VARCHAR', isNull: 0, maxLen: 50 },
    { name: 'sales_date', type: 'DATE', isNull: 0 },
    { name: 'sales_total', type: 'DECIMAL', isNull: 0 },
    { name: 'cashier_id', type: 'VARCHAR', isNull: 0, maxLen: 50 },
    { name: 'status', type: 'VARCHAR', isNull: 0, maxLen: 20 }
  ]);

  for (let i = 1; i <= 10; i++) {
    const ref = `BK-202610-${String(i).padStart(3, '0')}`;
    const total = 75000 + (i * 20000);
    const date = `2026-10-${String(Math.min(i, 5)).padStart(2, '0')}`;
    executeSql(db, `INSERT INTO "${physBookOrders}" VALUES (?, ?, ?, ?, ?, ?)`,
      [`BKO-${i}`, ref, date, total, i, 'COMPLETED']);
    
    // For record 5, simulate amount mismatch
    const saleTotal = i === 5 ? total - 15000 : total;
    executeSql(db, `INSERT INTO "${physBookSales}" VALUES (?, ?, ?, ?, ?, ?)`,
      [`BKS-${i}`, ref, date, saleTotal, `CSH-0${(i % 3) + 1}`, 'COMPLETED']);
  }

  // ========================================================
  // SCENARIO 3: EVENT TICKET RECONCILIATION
  // ========================================================
  const physTicketBookings = registerTableAndColumns(dbOpsId, 'DEMO_OPERATIONS_DB', 'tbl-ticket-bookings', 'ticket_bookings', 'Reservasi tiket konser dan festival musik', [
    { name: 'id', type: 'UUID', isPk: 1 },
    { name: 'booking_reference', type: 'VARCHAR', isNull: 0, maxLen: 50 },
    { name: 'booking_date', type: 'DATE', isNull: 0 },
    { name: 'ticket_price', type: 'DECIMAL', isNull: 0 },
    { name: 'attendee_email', type: 'VARCHAR', isNull: 0, maxLen: 100 },
    { name: 'booking_status', type: 'VARCHAR', isNull: 0, maxLen: 20 }
  ]);

  const physTicketPayments = registerTableAndColumns(dbRecsId, 'DEMO_RECORDS_DB', 'tbl-ticket-payments', 'ticket_payments', 'Konfirmasi penerimaan pembayaran gateway tiket', [
    { name: 'id', type: 'UUID', isPk: 1 },
    { name: 'booking_reference', type: 'VARCHAR', isNull: 0, maxLen: 50 },
    { name: 'payment_date', type: 'DATE', isNull: 0 },
    { name: 'payment_amount', type: 'DECIMAL', isNull: 0 },
    { name: 'gateway', type: 'VARCHAR', isNull: 0, maxLen: 50 },
    { name: 'payment_status', type: 'VARCHAR', isNull: 0, maxLen: 20 }
  ]);

  for (let i = 1; i <= 10; i++) {
    const ref = `TCK-FEST-${String(100 + i)}`;
    const price = 250000 + (i * 50000);
    const date = '2026-10-02';
    executeSql(db, `INSERT INTO "${physTicketBookings}" VALUES (?, ?, ?, ?, ?, ?)`,
      [`TCKB-${i}`, ref, date, price, `attendee${i}@domain.test`, i === 7 ? 'CANCELLED' : 'CONFIRMED']);
    executeSql(db, `INSERT INTO "${physTicketPayments}" VALUES (?, ?, ?, ?, ?, ?)`,
      [`TCKP-${i}`, ref, date, price, 'PAYMENT_GATEWAY', 'CONFIRMED']);
  }

  // ========================================================
  // SCENARIO 4: WAREHOUSE INVENTORY RECONCILIATION
  // ========================================================
  const physWarehouseMovements = registerTableAndColumns(dbOpsId, 'DEMO_OPERATIONS_DB', 'tbl-warehouse-movements', 'warehouse_movements', 'Pergerakan keluar masuk stok barang logistik gudang', [
    { name: 'id', type: 'UUID', isPk: 1 },
    { name: 'product_code', type: 'VARCHAR', isNull: 0, maxLen: 50 },
    { name: 'warehouse_id', type: 'VARCHAR', isNull: 0, maxLen: 50 },
    { name: 'movement_date', type: 'DATE', isNull: 0 },
    { name: 'expected_quantity', type: 'DECIMAL', isNull: 0 },
    { name: 'movement_type', type: 'VARCHAR', isNull: 0, maxLen: 20 }
  ]);

  const physInventoryRecords = registerTableAndColumns(dbRecsId, 'DEMO_RECORDS_DB', 'tbl-inventory-records', 'inventory_records', 'Hasil audit stok fisik (stock opname) gudang lapangan', [
    { name: 'id', type: 'UUID', isPk: 1 },
    { name: 'product_code', type: 'VARCHAR', isNull: 0, maxLen: 50 },
    { name: 'warehouse_id', type: 'VARCHAR', isNull: 0, maxLen: 50 },
    { name: 'audit_date', type: 'DATE', isNull: 0 },
    { name: 'recorded_quantity', type: 'DECIMAL', isNull: 0 },
    { name: 'auditor_name', type: 'VARCHAR', isNull: 0, maxLen: 100 }
  ]);

  for (let i = 1; i <= 10; i++) {
    const pCode = `SKU-WIDGET-${String(i).padStart(3, '0')}`;
    const qty = 50 + (i * 10);
    executeSql(db, `INSERT INTO "${physWarehouseMovements}" VALUES (?, ?, ?, ?, ?, ?)`,
      [`MOV-${i}`, pCode, 'WH-JAKARTA-01', '2026-10-01', qty, 'INBOUND']);
    // Record 4 has discrepancy: expected 90 vs recorded 85
    const recQty = i === 4 ? qty - 5 : qty;
    executeSql(db, `INSERT INTO "${physInventoryRecords}" VALUES (?, ?, ?, ?, ?, ?)`,
      [`INV-${i}`, pCode, 'WH-JAKARTA-01', '2026-10-01', recQty, 'Bambang Auditor']);
  }

  // ========================================================
  // REGISTER 4 MODULES IN CATALOG
  // ========================================================
  // 1. COFFEE_SALES_RECON
  const coffeeModuleConfig = {
    matchingFields: [
      { sourceField: 'order_id', targetField: 'order_id' }
    ],
    comparisonFields: [
      { sourceField: 'order_amount', targetField: 'paid_amount', comparisonType: 'AMOUNT', tolerance: 0.00 },
      { sourceField: 'order_date', targetField: 'payment_date', comparisonType: 'DATE', toleranceDays: 0 },
      { sourceField: 'order_status', targetField: 'payment_status', comparisonType: 'STATUS' }
    ],
    filters: { sourceFilter: '', targetFilter: '' },
    nullHandling: 'FAIL_ON_NULL',
    duplicatePolicy: 'FLAG_AMBIGUOUS'
  };

  executeSql(db, `INSERT OR REPLACE INTO _rms_modules VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'mod-coffee-sales',
      'COFFEE_SALES_RECON',
      'Rekonsiliasi transaksi penjualan kedai kopi antara pesanan POS dan data pembayaran gateway',
      'Order-to-Payment Reconciliation',
      'DEMO_OPERATIONS_DB',
      'coffee_orders',
      'DEMO_RECORDS_DB',
      'coffee_payments',
      JSON.stringify(coffeeModuleConfig),
      'Active',
      now,
      now
    ]);

  // 2. BOOKSTORE_ORDER_RECON
  const bookModuleConfig = {
    matchingFields: [
      { sourceField: 'order_reference', targetField: 'order_reference' }
    ],
    comparisonFields: [
      { sourceField: 'order_total', targetField: 'sales_total', comparisonType: 'AMOUNT', tolerance: 0.00 },
      { sourceField: 'order_date', targetField: 'sales_date', comparisonType: 'DATE', toleranceDays: 0 }
    ],
    filters: { sourceFilter: '', targetFilter: '' },
    nullHandling: 'FAIL_ON_NULL',
    duplicatePolicy: 'FLAG_AMBIGUOUS'
  };

  executeSql(db, `INSERT OR REPLACE INTO _rms_modules VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'mod-bookstore-orders',
      'BOOKSTORE_ORDER_RECON',
      'Pencocokan pesanan toko buku dengan pembukuan kasir fisik dan sistem invoice',
      'Two-Source Transaction Reconciliation',
      'DEMO_OPERATIONS_DB',
      'bookstore_orders',
      'DEMO_RECORDS_DB',
      'bookstore_sales',
      JSON.stringify(bookModuleConfig),
      'Active',
      now,
      now
    ]);

  // 3. EVENT_TICKET_RECON
  const ticketModuleConfig = {
    matchingFields: [
      { sourceField: 'booking_reference', targetField: 'booking_reference' }
    ],
    comparisonFields: [
      { sourceField: 'ticket_price', targetField: 'payment_amount', comparisonType: 'AMOUNT', tolerance: 0.00 },
      { sourceField: 'booking_status', targetField: 'payment_status', comparisonType: 'STATUS' }
    ],
    filters: { sourceFilter: '', targetFilter: '' },
    nullHandling: 'FAIL_ON_NULL',
    duplicatePolicy: 'FLAG_AMBIGUOUS'
  };

  executeSql(db, `INSERT OR REPLACE INTO _rms_modules VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'mod-event-ticket',
      'EVENT_TICKET_RECON',
      'Rekonsiliasi reservasi tiket konser musik terhadap status pembayaran gateway e-ticketing',
      'Two-Source Transaction Reconciliation',
      'DEMO_OPERATIONS_DB',
      'ticket_bookings',
      'DEMO_RECORDS_DB',
      'ticket_payments',
      JSON.stringify(ticketModuleConfig),
      'Active',
      now,
      now
    ]);

  // 4. WAREHOUSE_STOCK_RECON
  const warehouseModuleConfig = {
    matchingFields: [
      { sourceField: 'product_code', targetField: 'product_code' }
    ],
    comparisonFields: [
      { sourceField: 'expected_quantity', targetField: 'recorded_quantity', comparisonType: 'AMOUNT', tolerance: 0.00 }
    ],
    filters: { sourceFilter: '', targetFilter: '' },
    nullHandling: 'FAIL_ON_NULL',
    duplicatePolicy: 'FLAG_AMBIGUOUS'
  };

  executeSql(db, `INSERT OR REPLACE INTO _rms_modules VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'mod-warehouse-stock',
      'WAREHOUSE_STOCK_RECON',
      'Pencocokan log pergerakan stok gudang logistik terhadap audit fisik barang (stock opname)',
      'Inventory Reconciliation',
      'DEMO_OPERATIONS_DB',
      'warehouse_movements',
      'DEMO_RECORDS_DB',
      'inventory_records',
      JSON.stringify(warehouseModuleConfig),
      'Active',
      now,
      now
    ]);

  // ========================================================
  // REGISTER 4 CORRESPONDING JOBS
  // ========================================================
  // Job 1 (Default): JOB_COFFEE_SALES_RECON
  executeSql(db, `INSERT OR REPLACE INTO _rms_jobs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'job-coffee-sales',
      'JOB_COFFEE_SALES_RECON',
      'Job harian rekonsiliasi pesanan POS coffee shop terhadap mutasi penerimaan pembayaran kasir',
      JSON.stringify(['mod-coffee-sales']),
      JSON.stringify(['EXTRACT_ORDERS', 'EXTRACT_PAYMENTS', 'mod-coffee-sales', 'GENERATE_REPORT']),
      JSON.stringify({ ['mod-coffee-sales']: ['EXTRACT_ORDERS', 'EXTRACT_PAYMENTS'] }),
      3,
      300,
      1,
      now,
      now
    ]);

  // Job 2: JOB_BOOKSTORE_ORDER_RECON
  executeSql(db, `INSERT OR REPLACE INTO _rms_jobs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'job-bookstore-orders',
      'JOB_BOOKSTORE_ORDER_RECON',
      'Job otomatisasi audit buku penjualan harian toko buku',
      JSON.stringify(['mod-bookstore-orders']),
      JSON.stringify(['mod-bookstore-orders']),
      JSON.stringify({}),
      3,
      300,
      1,
      now,
      now
    ]);

  // Job 3: JOB_EVENT_TICKET_RECON
  executeSql(db, `INSERT OR REPLACE INTO _rms_jobs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'job-event-ticket',
      'JOB_EVENT_TICKET_RECON',
      'Job validasi settlement tiket konser dan konfirmasi booking tiket event',
      JSON.stringify(['mod-event-ticket']),
      JSON.stringify(['mod-event-ticket']),
      JSON.stringify({}),
      3,
      300,
      1,
      now,
      now
    ]);

  // Job 4: JOB_WAREHOUSE_STOCK_RECON
  executeSql(db, `INSERT OR REPLACE INTO _rms_jobs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'job-warehouse-stock',
      'JOB_WAREHOUSE_STOCK_RECON',
      'Job rekonsiliasi selisih stok gudang logistik dan audit inventaris',
      JSON.stringify(['mod-warehouse-stock']),
      JSON.stringify(['mod-warehouse-stock']),
      JSON.stringify({}),
      3,
      300,
      1,
      now,
      now
    ]);

  // Schedules
  executeSql(db, `INSERT OR REPLACE INTO _rms_job_schedules VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'sch-coffee-01',
      'job-coffee-sales',
      'Jadwal Harian Tutup Kasir (22:00 WIB)',
      '0 22 * * *',
      'Asia/Jakarta',
      1,
      null,
      new Date(Date.now() + 3600000).toISOString(),
      3,
      now
    ]);

  // Matching Rules catalog
  const rules = [
    { id: 'rule-exact-id', name: 'Order / Reference ID Match', type: 'EXACT_MATCH', desc: 'Pencocokan 1:1 berdasarkan identifier unik pesanan atau transaksi', config: JSON.stringify({ field: 'order_id' }) },
    { id: 'rule-amount-strict', name: 'Amount Equality Strict Comparison', type: 'AMOUNT_COMPARISON', desc: 'Validasi nominal pembayaran dengan toleransi selisih 0.00', config: JSON.stringify({ tolerance: 0.00 }) },
    { id: 'rule-date-daily', name: 'Transaction Date Synchronicity', type: 'DATE_COMPARISON', desc: 'Pencocokan tanggal transaksi kalender dengan toleransi 0 hari', config: JSON.stringify({ toleranceDays: 0 }) },
    { id: 'rule-dup-guard', name: 'Duplicate Key Detection Guard', type: 'DUPLICATE_DETECTION', desc: 'Mencegah pencocokan ganda ambigu jika ditemukan duplikasi ID di sumber/target', config: JSON.stringify({ flagDuplicate: true }) },
  ];

  for (const r of rules) {
    executeSql(db, `INSERT OR REPLACE INTO _rms_matching_rules VALUES (?, ?, ?, ?, ?, ?)`,
      [r.id, r.name, r.type, r.desc, r.config, now]);
  }

  addAuditLog(db, 'SYSTEM_INIT', 'DATABASE', 'ALL', 'Inisialisasi sistem: Database DEMO_OPERATIONS_DB, DEMO_RECORDS_DB, dan 4 modul bisnis dibuat.');
  console.log('[SEED] Skenario bisnis berhasil diinisialisasi.');
}
