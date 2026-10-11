# 06. REST API Specification

**Base URL:** `http://localhost:3000/api`  
**Content-Type:** `application/json`  
**Authentication:** Open (Simulation Mode)  

---

## 1. System & Health

### `GET /api/health`
Checks application health and database engine status.
- **Response (200 OK):**
```json
{
  "status": "HEALTHY",
  "app": "Reconciliation Studio",
  "subtitle": "Dynamic Data Reconciliation & Job Management Platform",
  "engine": "SQLite WASM Embedded Simulator",
  "storageNotice": "Data tersimpan dalam container lokal SQLite file. Bukan penyimpanan PostgreSQL eksternal permanen.",
  "databaseCount": 3,
  "timestamp": "2026-10-11T06:00:00.000Z"
}
```

### `POST /api/system/reset`
Resets all databases, physical tables, modules, and seeded test data back to original state.
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Database dan dataset demo berhasil di-reset ke kondisi awal."
}
```

---

## 2. Database Management

### `GET /api/databases`
Lists all logical databases with their registered physical tables and row counts.
- **Response (200 OK):**
```json
[
  {
    "id": "db-operations",
    "name": "DEMO_OPERATIONS_DB",
    "description": "Operational source transactions",
    "tables": [
      {
        "id": "tbl-coffee-orders",
        "table_name": "coffee_orders",
        "physical_table_name": "tbl_DEMO_OPERATIONS_DB_coffee_orders",
        "rowCount": 13
      }
    ]
  }
]
```

### `POST /api/databases`
Creates a new logical database.
- **Request Body:**
```json
{
  "name": "WAREHOUSE_DB",
  "description": "Logistics and inventory records"
}
```
- **Response (201 Created):**
```json
{
  "id": "db-1728620000000",
  "name": "WAREHOUSE_DB",
  "description": "Logistics and inventory records"
}
```

---

## 3. Dynamic Table Designer

### `POST /api/databases/:dbName/tables`
Creates a physical table in SQLite and registers its columns in the catalog.
- **Request Body:**
```json
{
  "tableName": "shipments",
  "description": "Shipment tracking table",
  "columns": [
    { "columnName": "id", "dataType": "UUID", "isPrimaryKey": true, "isNullable": false },
    { "columnName": "tracking_code", "dataType": "VARCHAR", "maxLength": 50, "isNullable": false },
    { "columnName": "weight_kg", "dataType": "DECIMAL", "isNullable": false },
    { "columnName": "ship_date", "dataType": "DATE", "isNullable": false }
  ]
}
```
- **Response (201 Created):**
```json
{
  "id": "tbl-1728620000",
  "databaseName": "WAREHOUSE_DB",
  "tableName": "shipments",
  "physicalTableName": "tbl_WAREHOUSE_DB_shipments",
  "columnsCount": 4
}
```

### `POST /api/tables/preview-sql`
Generates and returns valid SQL DDL without executing it.
- **Request Body:**
```json
{
  "databaseName": "DEMO_OPERATIONS_DB",
  "tableName": "sample_table",
  "columns": [
    { "columnName": "id", "dataType": "UUID", "isPrimaryKey": true, "isNullable": false },
    { "columnName": "amount", "dataType": "DECIMAL", "isNullable": false }
  ]
}
```
- **Response (200 OK):**
```json
{
  "physicalTableName": "tbl_DEMO_OPERATIONS_DB_sample_table",
  "sql": "CREATE TABLE \"tbl_DEMO_OPERATIONS_DB_sample_table\" (\n  \"id\" TEXT PRIMARY KEY,\n  \"amount\" REAL NOT NULL\n);"
}
```

---

## 4. Reconciliation Modules & Template Provisioning

### `POST /api/modules/provision-from-template`
One-click auto-provisions a complete reconciliation module from a business template.
- **Request Body:**
```json
{
  "moduleName": "Restaurant Orders",
  "templateType": "ORDER_TO_PAYMENT",
  "generateSampleData": true
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Modul 'RESTAURANT_ORDERS_RECON' dan Job 'JOB_RESTAURANT_ORDERS_RECON' berhasil dibuat.",
  "module": {
    "id": "mod-1728620000",
    "module_name": "RESTAURANT_ORDERS_RECON",
    "source_database": "DEMO_OPERATIONS_DB",
    "source_table": "restaurant_orders_source",
    "target_database": "DEMO_RECORDS_DB",
    "target_table": "restaurant_orders_target",
    "module_type": "Order-to-Payment Reconciliation"
  },
  "job": {
    "id": "job-1728620000",
    "job_name": "JOB_RESTAURANT_ORDERS_RECON"
  }
}
```

---

## 5. Job Execution & Orchestration

### `POST /api/jobs/:id/run`
Executes a reconciliation job immediately.
- **Response (200 OK):**
```json
{
  "success": true,
  "executionId": "EXEC-20261011060000-ABCD",
  "jobId": "job-coffee-sales",
  "jobName": "JOB_COFFEE_SALES_RECON",
  "status": "PARTIAL_SUCCESS",
  "startTime": "2026-10-11T06:00:00.000Z",
  "endTime": "2026-10-11T06:00:00.045Z",
  "durationMs": 45,
  "totalSource": 13,
  "totalTarget": 12,
  "matchedCount": 6,
  "unmatchedCount": 9,
  "summary": {
    "matchingRate": 40.0,
    "amountMismatchCount": 1,
    "dateMismatchCount": 1,
    "statusMismatchCount": 1,
    "duplicateCount": 2,
    "sourceOnlyCount": 1,
    "targetOnlyCount": 2,
    "pendingCount": 1
  }
}
```

---

## 6. Reconciliation Results & Reports

### `GET /api/reconciliation-results`
Queries individual reconciliation comparison results.
- **Query Parameters:** `executionId`, `status`, `search`, `page`, `limit`
- **Response (200 OK):**
```json
{
  "results": [
    {
      "id": "REC-abc1234",
      "execution_id": "EXEC-20261011060000-ABCD",
      "matching_key": "CF-202610-001",
      "source_amount": 48000,
      "target_amount": 48000,
      "difference": 0,
      "reconciliation_status": "MATCHED",
      "reason": "Transaksi cocok sempurna (100% Match)"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### `GET /api/reports/export/:executionId?type=ALL`
Streams a downloaded CSV file containing actual reconciliation results.
- **Response (200 OK):**
```text
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="recon_report_EXEC-20261011060000-ABCD_all.csv"

"ID","Execution ID","Matching Key","Status","Source Amount","Target Amount","Difference","Reason","Created At"
"REC-1","EXEC-20261011060000-ABCD","CF-202610-001","MATCHED",48000,48000,0,"Transaksi cocok sempurna (100% Match)","2026-10-11T06:00:00.000Z"
```

---

## 7. Presentation Export

### `GET /api/presentation/download`
Generates and downloads the full 16-slide PowerPoint file.
- **Response (200 OK):**
`Content-Disposition: attachment; filename="Reconciliation_Studio_Presentation.pptx"`
