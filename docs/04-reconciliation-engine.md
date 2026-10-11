# 04. Reconciliation Engine Specification

**Module:** Reconciliation Matching Engine  
**Implementation:** `server/services/reconciliationEngine.ts`  
**Execution Paradigm:** 100% Deterministic, In-Memory Indexing, One-to-One Consumption  

---

## 1. Overview & Data Extraction

The reconciliation engine reads records directly from physical SQLite tables defined in the metadata catalog.
Given a module configuration:
```json
{
  "sourceDatabase": "DEMO_OPERATIONS_DB",
  "sourceTable": "coffee_orders",
  "targetDatabase": "DEMO_RECORDS_DB",
  "targetTable": "coffee_payments"
}
```
The engine resolves the physical table names:
- `tbl_DEMO_OPERATIONS_DB_coffee_orders`
- `tbl_DEMO_RECORDS_DB_coffee_payments`

Records are fetched using parameterized SQL queries:
```sql
SELECT * FROM "tbl_DEMO_OPERATIONS_DB_coffee_orders";
SELECT * FROM "tbl_DEMO_RECORDS_DB_coffee_payments";
```

---

## 2. Field Mapping & Key Construction

### 2.1 Single and Composite Matching Keys
The engine constructs normalized string keys for each record based on `config.matchingFields`:
- **Single Key:** e.g., `order_id` -> `"CF-202610-001"`
- **Composite Key:** e.g., `product_code` + `warehouse_id` -> `"SKU-001__WH-JAKARTA-01"`

Values are trimmed and converted to uppercase strings. Missing or null keys are assigned the sentinel `"NULL"`.

### 2.2 Dynamic Attribute Extraction
The engine inspects `config.comparisonFields` to extract:
- **Amount Field:** Identifies fields with `comparisonType: "AMOUNT"` (e.g. `order_amount` vs `paid_amount`). Numeric values are parsed and sanitized.
- **Date Field:** Identifies fields with `comparisonType: "DATE"` (e.g. `order_date` vs `payment_date`).
- **Status Field:** Identifies fields with `comparisonType: "STATUS"` (e.g. `order_status` vs `payment_status`).

---

## 3. The 10-Step Reconciliation Algorithm

```mermaid
flowchart TD
    Start([Start Reconciliation]) --> Step1[1. Validate Module Config & JSON]
    Step1 --> Step2[2. Verify Physical Tables Exist in SQLite]
    Step2 --> Step3[3. Load Source Records from Physical Table]
    Step3 --> Step4[4. Load Target Records from Physical Table]
    Step4 --> Step5[5. Normalize Values & Build Key Hash Maps]
    Step5 --> Step6[6. Detect Ambiguous Duplicate Keys in Source & Target]
    Step6 --> Step7[7. Flag & Isolate Duplicate Records as DUPLICATE]
    Step7 --> Step8[8. Execute 1:1 Matching on Non-Duplicate Records]
    Step8 --> Step9{Target Match Found?}
    Step9 -- No --> SOnly[Classify as SOURCE_ONLY]
    Step9 -- Yes --> Compare[9. Compare Amount, Date, Status]
    Compare --> Classify[Assign Classification: MATCHED, AMOUNT_MISMATCH, DATE_MISMATCH, STATUS_MISMATCH, PENDING]
    SOnly --> TOnlyCheck[Check Unconsumed Target Records]
    Classify --> TOnlyCheck
    TOnlyCheck --> TOnly[Classify Unconsumed Target as TARGET_ONLY]
    TOnly --> Step10[10. Commit Results to _rms_reconciliation_results & Update KPI Stats]
    Step10 --> Finish([Finish Execution])
```

---

## 4. Result Classification Hierarchy

When evaluating record pairs, the engine resolves classifications deterministically using the following strict priority:

1. **`DUPLICATE`:** Triggered if a matching key appears more than once in source or target. Prevents false settlement pairing.
2. **`PENDING`:** Triggered if either source or target record status is `"PENDING"`.
3. **`AMOUNT_MISMATCH`:** Triggered if `|source_amount - target_amount| > tolerance`.
4. **`DATE_MISMATCH`:** Triggered if transaction dates differ by more than `toleranceDays`.
5. **`STATUS_MISMATCH`:** Triggered if operational statuses differ (e.g. `COMPLETED` vs `REFUNDED`).
6. **`MATCHED`:** Assigned when all configured comparison attributes match within tolerance (100% Match).
7. **`SOURCE_ONLY`:** Assigned to source records with no corresponding target key.
8. **`TARGET_ONLY`:** Assigned to target records with no corresponding source key.

---

## 5. End-to-End Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Frontend (React)
    participant API as API Router (api.ts)
    participant Orchestrator as Job Orchestrator
    participant Engine as Reconciliation Engine
    participant DB as SQLite WASM
    participant Audit as Audit Logger

    User->>UI: Click "Run Now" on Job
    UI->>API: POST /api/jobs/:id/run
    API->>Orchestrator: runJob(db, jobId)
    Orchestrator->>DB: Check Concurrency Lock & Insert RUNNING Execution
    Orchestrator->>Engine: executeReconciliationModule(db, execId, moduleId)
    Engine->>DB: Read Source & Target Physical Tables
    DB-->>Engine: Return Rows
    Engine->>Engine: Detect Duplicates & Perform 1:1 Matching
    Engine->>DB: Batch Insert into _rms_reconciliation_results
    Engine-->>Orchestrator: Return Consolidated Summary & Statistics
    Orchestrator->>DB: Update _rms_job_executions (SUCCESS / PARTIAL_SUCCESS)
    Orchestrator->>Audit: addAuditLog(JOB_EXECUTED)
    Audit->>DB: Insert into _rms_audit_logs
    Orchestrator-->>API: Return JobRunResult JSON
    API-->>UI: Return 200 OK with Results Summary
    UI-->>User: Display Success Badge & Update Metrics
```

---

## 6. Error Handling & Idempotency

- **Missing Physical Tables:** If tables have not been created in SQLite, the engine halts with an informative error: `"Tabel fisik ... belum dibuat dalam database."`
- **Invalid JSON Configuration:** Throws a validation exception and marks execution as `FAILED` with captured stack trace.
- **Concurrency Guards:** Active jobs are held in `activeRunningJobs: Set<string>`. Any simultaneous request to run the same job returns HTTP 409 conflict.
- **Transaction Rollback:** All results are written inside standard transactions or discrete batch insertions to prevent orphaned records.
