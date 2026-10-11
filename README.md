# Reconciliation Studio

> **Dynamic Data Reconciliation & Job Management Platform**  
> Enterprise banking-grade data matching, automated settlement audits, and job orchestration simulator.

![Reconciliation Studio Version](https://img.shields.io/badge/version-2.5.0-blue)
![Architecture](https://img.shields.io/badge/architecture-Full--Stack%20TypeScript-emerald)
![Database Engine](https://img.shields.io/badge/database-SQLite%20WASM%20Simulator-purple)
![License](https://img.shields.io/badge/license-Apache%202.0-slate)

---

## Overview

**Reconciliation Studio** is a full-stack web application designed to automate high-volume transaction matching between operational sources (POS orders, event tickets, warehouse movements) and verification ledgers (payment gateways, bank journals, physical inventory audits).

Built with React 19, Express, TypeScript, and an embedded WebAssembly SQLite engine (`sql.js`), it executes real SQL DDL and DML operations without requiring external database servers or Docker containers.

---

## Key Features

- **Database Manager:** Manage logical databases (`DEMO_OPERATIONS_DB`, `DEMO_RECORDS_DB`, `RECONCILIATION_DB`), inspect physical tables, and run read-only SQL queries.
- **Dynamic Table Designer:** Create physical tables without writing SQL. Supports UUID, VARCHAR, DECIMAL, DATE, TIMESTAMP, primary keys, and unique constraints.
- **Template-Based Module Factory:** Provision complete reconciliation modules in 1-click (Order-to-Payment, Two-Source Transaction, Inventory Stock Audit).
- **Deterministic Matching Engine:** 100% predictable 1:1 matching, composite keys, numeric tolerance bounds, cut-off date checks, and ambiguous duplicate isolation.
- **Job Orchestration & Monitoring:** Visual pipeline DAG, in-process concurrency locking, millisecond duration tracking, and live step-by-step logging.
- **Side-by-Side Results Dashboard:** Inspect row-by-row comparisons highlighting exact discrepancies, and download compliance-ready CSV reports.
- **Executive PowerPoint Export:** Generates an editable 16-slide widescreen presentation (`Reconciliation_Studio_Presentation.pptx`) via `pptxgenjs`.
- **Integrated In-App Documentation:** Complete 10-chapter technical specification and user guide readable directly inside the web interface.

---

## Quick Start

### 1. Installation
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
# Server listening at http://localhost:3000
```

### 3. Production Build
```bash
npm run build
npm start
```

---

## Verified Demonstration Modules

1. **Coffee Shop Sales Reconciliation (`COFFEE_SALES_RECON`)**  
   Reconciles POS orders against payment gateway records. Test data deterministically exercises exact match, amount mismatch, date shift, status divergence, and duplicate attempts.
2. **Bookstore Orders Reconciliation (`BOOKSTORE_ORDER_RECON`)**  
   Audits bookstore invoices against cashier sales journals.
3. **Event Ticket Reconciliation (`EVENT_TICKET_RECON`)**  
   Validates concert ticket bookings against ticketing gateway settlements.
4. **Warehouse Inventory Reconciliation (`WAREHOUSE_STOCK_RECON`)**  
   Audits inbound logistics movements against physical stock opname counts.

---

## Documentation Suite

Full technical specifications, diagrams, and developer manuals are located in `docs/`:
- [`docs/01-technical-specification.md`](docs/01-technical-specification.md)
- [`docs/02-system-architecture.md`](docs/02-system-architecture.md)
- [`docs/03-database-design.md`](docs/03-database-design.md)
- [`docs/04-reconciliation-engine.md`](docs/04-reconciliation-engine.md)
- [`docs/05-job-management.md`](docs/05-job-management.md)
- [`docs/06-api-specification.md`](docs/06-api-specification.md)
- [`docs/07-user-guide.md`](docs/07-user-guide.md)
- [`docs/08-step-by-step-examples.md`](docs/08-step-by-step-examples.md)
- [`docs/09-developer-guide.md`](docs/09-developer-guide.md)
- [`docs/10-troubleshooting.md`](docs/10-troubleshooting.md)
- [`docs/openapi.yaml`](docs/openapi.yaml)
- [`docs/presentation-outline.md`](docs/presentation-outline.md)
- [`docs/presentation-speaker-notes.md`](docs/presentation-speaker-notes.md)
