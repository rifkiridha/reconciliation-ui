# 02. System Architecture

**Application:** Reconciliation Studio  
**Pattern:** Clean Layered Full-Stack Architecture (Client-Server SPA)  
**Language:** TypeScript (Strict Typing across Frontend and Backend)  

---

## 1. Architectural Overview

Reconciliation Studio separates responsibilities into four distinct tiers:
1. **Presentation Tier (React SPA):** Handles dashboard metrics, interactive spreadsheet tables, side-by-side inspection modals, and live execution monitoring.
2. **Controller & Route Tier (Express Router):** Validates incoming HTTP requests via Zod, enforces authorization boundaries, and dispatches actions to domain services.
3. **Domain Engine Tier (Reconciliation & Orchestrator Services):** Encapsulates pure deterministic matching algorithms, duplicate key isolation, retry logic, and step-by-step logging.
4. **Data Access & Storage Tier (SQLite WASM Catalog):** Manages metadata catalog tables, generates physical SQL DDL, runs parameterized SQL queries, and syncs binary buffers to container storage.

---

## 2. Component Structure Diagram

```mermaid
graph TB
    subgraph Client Tier
        UI_Dash["Dashboard (Dashboard.tsx)"]
        UI_DB["Database Manager (DatabaseManager.tsx)"]
        UI_Designer["Table Designer (TableDesigner.tsx)"]
        UI_Data["Data Explorer (DataExplorer.tsx)"]
        UI_Mod["Modules & Templates (ReconciliationModules.tsx)"]
        UI_Rules["Matching Rules (MatchingRules.tsx)"]
        UI_Jobs["Job Designer (JobDesigner.tsx)"]
        UI_Sched["Job Scheduler (JobScheduler.tsx)"]
        UI_Exec["Execution History (ExecutionHistory.tsx)"]
        UI_Res["Results Dashboard (ReconciliationResults.tsx)"]
        UI_Rep["Reports & Export (ReportsExport.tsx)"]
        UI_Audit["Audit Trail (AuditLogs.tsx)"]
        UI_Pres["Presentations (PresentationManager.tsx)"]
        UI_Doc["Documentation (DocumentationViewer.tsx)"]
    end

    subgraph Server Tier
        Server["Express Server (server.ts)"]
        Router["REST Router (server/routes/api.ts)"]
        JobOrch["Job Orchestrator (jobOrchestrator.ts)"]
        ReconEng["Reconciliation Engine (reconciliationEngine.ts)"]
        PresGen["Presentation Generator (presentationGenerator.ts)"]
    end

    subgraph Data Tier
        DB["SQLite WASM (server/db/database.ts)"]
        Seed["Initial Seeder (server/db/seed.ts)"]
        Disk["SQLite Binary (data/rms_database.sqlite)"]
        PPTX["Export File (Reconciliation_Studio_Presentation.pptx)"]
    end

    Client Tier -->|REST / JSON| Router
    Router --> JobOrch
    Router --> ReconEng
    Router --> PresGen
    Router --> DB
    JobOrch --> ReconEng
    JobOrch --> DB
    ReconEng --> DB
    Seed --> DB
    DB --> Disk
    PresGen --> PPTX
```

---

## 3. Data Flow and Request Lifecycle

### 3.1 Job Execution Flow
1. **Trigger:** The client posts to `/api/jobs/:id/run`.
2. **Locking:** `jobOrchestrator.ts` verifies that the job is not already running; if active, it returns HTTP 409 to prevent duplicate runs.
3. **Execution Record:** An execution record is inserted into `_rms_job_executions` with status `RUNNING`.
4. **Module Dispatch:** For each module attached in the job's `module_ids`:
   - `reconciliationEngine.ts` loads source rows and target rows from physical tables.
   - Values are normalized and matching keys are constructed.
   - Ambiguous duplicate keys are isolated and flagged as `DUPLICATE`.
   - 1:1 pairing and attribute comparisons (amount, date, status) are performed.
   - Classifications are assigned and committed to `_rms_reconciliation_results`.
   - Step logs are appended to `_rms_execution_logs`.
5. **Consolidation:** The orchestrator aggregates metrics (total source, target, matched, unmatched, matching rate, net financial difference) and updates `_rms_job_executions` to `SUCCESS` or `PARTIAL_SUCCESS`.
6. **Audit Trail:** An immutable audit log is committed to `_rms_audit_logs`.
7. **Response:** A consolidated JSON summary is returned to the client.

---

## 4. Security & Identifier Sanitization

Because the Table Designer allows creating dynamic tables and columns, the application enforces strict sanitization on all user-supplied identifiers:
- **Database Names:** Filtered via `/^[A-Z0-9_]+$/`.
- **Table Names:** Normalized to lowercase snake_case via `/^[a-z0-9_]+$/`.
- **Physical Table Identifiers:** Prefixed and escaped as `tbl_<DB>_<table>` with safe double-quoting in SQL statements.
- **SQL Injection Prevention:** All data queries (SELECT, INSERT, UPDATE, DELETE) utilize parameterized prepared statements (`stmt.bind(params)` and `stmt.run(params)`).
- **Read-Only Query Runner:** The interactive query runner strictly restricts execution to `SELECT`, `PRAGMA`, and `EXPLAIN` statements.
