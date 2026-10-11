# 03. Database Design

**Engine:** SQLite (WebAssembly `sql.js`) with File Buffer Sync  
**Architecture:** Multi-Schema Logical Catalog with Isolated Physical Tables  
**File Location:** `./data/rms_database.sqlite`  

---

## 1. Overview of Logical Databases

Reconciliation Studio isolates business data into three logical databases:

1. **`DEMO_OPERATIONS_DB`:**  
   Houses operational source tables that record incoming orders, bookings, and inventory movements:
   - `tbl_DEMO_OPERATIONS_DB_coffee_orders`
   - `tbl_DEMO_OPERATIONS_DB_bookstore_orders`
   - `tbl_DEMO_OPERATIONS_DB_ticket_bookings`
   - `tbl_DEMO_OPERATIONS_DB_warehouse_movements`
   - Dynamic user-created source tables (`<module>_source`)

2. **`DEMO_RECORDS_DB`:**  
   Houses verification and settlement target records from gateways, journals, and audits:
   - `tbl_DEMO_RECORDS_DB_coffee_payments`
   - `tbl_DEMO_RECORDS_DB_bookstore_sales`
   - `tbl_DEMO_RECORDS_DB_ticket_payments`
   - `tbl_DEMO_RECORDS_DB_inventory_records`
   - Dynamic user-created target tables (`<module>_target`)

3. **`RECONCILIATION_DB`:**  
   Stores platform catalog metadata, execution histories, step logs, and matching results:
   - `_rms_databases`
   - `_rms_tables`
   - `_rms_columns`
   - `_rms_modules`
   - `_rms_matching_rules`
   - `_rms_jobs`
   - `_rms_job_schedules`
   - `_rms_job_executions`
   - `_rms_execution_logs`
   - `_rms_reconciliation_results`
   - `_rms_audit_logs`

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    _rms_databases ||--o{ _rms_tables : contains
    _rms_tables ||--o{ _rms_columns : defines
    _rms_modules ||--o{ _rms_reconciliation_results : produces
    _rms_jobs ||--o{ _rms_job_schedules : scheduled_by
    _rms_jobs ||--o{ _rms_job_executions : runs
    _rms_job_executions ||--o{ _rms_execution_logs : logs
    _rms_job_executions ||--o{ _rms_reconciliation_results : records

    _rms_databases {
        string id PK
        string name UK
        string description
        string created_at
        string updated_at
    }

    _rms_tables {
        string id PK
        string database_id FK
        string database_name
        string table_name
        string physical_table_name UK
        string description
        string created_at
        string updated_at
    }

    _rms_columns {
        string id PK
        string table_id FK
        string column_name
        string data_type
        int max_length
        int is_nullable
        int is_primary_key
        int is_unique
        string default_value
        int ordinal_position
    }

    _rms_modules {
        string id PK
        string module_name UK
        string description
        string module_type
        string source_database
        string source_table
        string target_database
        string target_table
        string matching_config
        string status
        string created_at
        string updated_at
    }

    _rms_jobs {
        string id PK
        string job_name UK
        string description
        string module_ids
        string execution_order
        string dependencies
        int retry_limit
        int timeout_seconds
        int is_active
        string created_at
        string updated_at
    }

    _rms_job_executions {
        string id PK
        string job_id FK
        string job_name
        string status
        string start_time
        string end_time
        int duration_ms
        int total_source
        int total_target
        int matched_count
        int unmatched_count
        int error_count
        string summary_json
        string error_message
        string created_at
    }

    _rms_execution_logs {
        string id PK
        string execution_id FK
        string timestamp
        string log_level
        string message
    }

    _rms_reconciliation_results {
        string id PK
        string execution_id FK
        string module_id FK
        string source_record_id
        string target_record_id
        string matching_key
        real source_amount
        real target_amount
        real difference
        string reconciliation_status
        string reason
        string source_data_json
        string target_data_json
        string created_at
    }

    _rms_audit_logs {
        string id PK
        string timestamp
        string action
        string entity_type
        string entity_id
        string description
        string result
    }
```

---

## 3. Physical Table Schema Examples

### 3.1 Coffee Shop Sales Module
```sql
-- Source Table (DEMO_OPERATIONS_DB)
CREATE TABLE "tbl_DEMO_OPERATIONS_DB_coffee_orders" (
  "id" TEXT PRIMARY KEY,
  "order_id" TEXT NOT NULL,
  "order_date" TEXT NOT NULL,
  "order_amount" REAL NOT NULL,
  "customer_name" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "order_status" TEXT NOT NULL
);

-- Target Table (DEMO_RECORDS_DB)
CREATE TABLE "tbl_DEMO_RECORDS_DB_coffee_payments" (
  "id" TEXT PRIMARY KEY,
  "order_id" TEXT NOT NULL,
  "payment_date" TEXT NOT NULL,
  "paid_amount" REAL NOT NULL,
  "payment_method" TEXT NOT NULL,
  "payment_status" TEXT NOT NULL
);
```

### 3.2 Warehouse Inventory Module
```sql
-- Source Table (DEMO_OPERATIONS_DB)
CREATE TABLE "tbl_DEMO_OPERATIONS_DB_warehouse_movements" (
  "id" TEXT PRIMARY KEY,
  "product_code" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "movement_date" TEXT NOT NULL,
  "expected_quantity" REAL NOT NULL,
  "movement_type" TEXT NOT NULL
);

-- Target Table (DEMO_RECORDS_DB)
CREATE TABLE "tbl_DEMO_RECORDS_DB_inventory_records" (
  "id" TEXT PRIMARY KEY,
  "product_code" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "audit_date" TEXT NOT NULL,
  "recorded_quantity" REAL NOT NULL,
  "auditor_name" TEXT NOT NULL
);
```

---

## 4. Automatic Table Provisioning in Templates

When a user calls `POST /api/modules/provision-from-template`, the system executes the following steps:
1. Normalizes the module name into a clean code (e.g. `RESTAURANT_ORDERS_RECON`).
2. Derives physical table names:
   - `tbl_DEMO_OPERATIONS_DB_restaurant_orders_source`
   - `tbl_DEMO_RECORDS_DB_restaurant_orders_target`
3. Runs dynamic SQL DDL statements creating the tables with columns matching the template type.
4. Registers the tables in `_rms_tables` and columns in `_rms_columns`.
5. Optionally seeds deterministic synthetic test records.
6. Saves the module configuration into `_rms_modules` and the job into `_rms_jobs`.
