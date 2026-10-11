# 09. Developer Guide

**Target Audience:** Full-Stack Engineers, DevOps, System Maintainers  
**Language:** TypeScript (Node.js ES Modules)  
**Package Manager:** npm / bun  

---

## 1. Project Directory Structure

```text
├── data/
│   └── rms_database.sqlite          # SQLite WASM persistent file buffer
├── docs/                            # Complete technical documentation suite
│   ├── 01-technical-specification.md
│   ├── 02-system-architecture.md
│   ├── 03-database-design.md
│   ├── 04-reconciliation-engine.md
│   ├── 05-job-management.md
│   ├── 06-api-specification.md
│   ├── 07-user-guide.md
│   ├── 08-step-by-step-examples.md
│   ├── 09-developer-guide.md
│   ├── 10-troubleshooting.md
│   ├── openapi.yaml
│   ├── presentation-outline.md
│   ├── presentation-speaker-notes.md
│   └── README.md
├── public/
│   └── Reconciliation_Studio_Presentation.pptx # Pre-generated presentation
├── server/
│   ├── db/
│   │   ├── database.ts              # SQLite WASM initialization, catalog, DDL
│   │   └── seed.ts                  # Deterministic demo dataset seeder
│   ├── routes/
│   │   └── api.ts                   # Express REST API routes and controllers
│   └── services/
│       ├── jobOrchestrator.ts       # Job execution, locking, and step logging
│       ├── presentationGenerator.ts # PptxGenJS 16-slide presentation generator
│       └── reconciliationEngine.ts  # Deterministic matching algorithm
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── StatusBadge.tsx
│   ├── pages/
│   │   ├── AuditLogs.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DatabaseManager.tsx
│   │   ├── DataExplorer.tsx
│   │   ├── DocumentationViewer.tsx
│   │   ├── ExecutionHistory.tsx
│   │   ├── JobDesigner.tsx
│   │   ├── JobScheduler.tsx
│   │   ├── MatchingRules.tsx
│   │   ├── PresentationManager.tsx
│   │   ├── ReconciliationModules.tsx
│   │   ├── ReconciliationResults.tsx
│   │   ├── ReportsExport.tsx
│   │   ├── SettingsPage.tsx
│   │   └── TableDesigner.tsx
│   ├── services/
│   │   └── api.ts                   # Frontend API client
│   ├── types/
│   │   └── index.ts                 # TypeScript shared types & interfaces
│   ├── App.tsx
│   ├── index.css                    # Tailwind CSS v4 entry
│   └── main.tsx
├── package.json
├── server.ts                        # Full-stack server entry point
├── tsconfig.json
└── vite.config.ts
```

---

## 2. Getting Started

### 2.1 Installation
```bash
npm install
```

### 2.2 Local Development Server
The application runs both Express backend API routes and the Vite React frontend on a unified port (`3000`):
```bash
npm run dev
# Starts: tsx server.ts (running on http://0.0.0.0:3000)
```

### 2.3 Production Build
```bash
npm run build
npm start
```

---

## 3. Database Abstraction & Adding New Matching Rules

### 3.1 Adding a New Matching Comparison Rule
To add a new comparison rule (e.g. fuzzy string similarity or percentage ratio tolerance):
1. Open `server/services/reconciliationEngine.ts`.
2. Add your comparison type to `ComparisonFieldConfig['comparisonType']`:
   ```typescript
   export interface ComparisonFieldConfig {
     sourceField: string;
     targetField: string;
     comparisonType: 'EXACT' | 'AMOUNT' | 'DATE' | 'STATUS' | 'RATIO';
     toleranceRatio?: number;
   }
   ```
3. In the attribute evaluation loop inside `executeReconciliationModule()`, add the evaluation block:
   ```typescript
   else if (comp.comparisonType === 'RATIO') {
     const ratio = sNum / (tNum || 1);
     if (Math.abs(1.0 - ratio) > (comp.toleranceRatio || 0.05)) {
       amountMismatch = true;
     }
   }
   ```
4. Expose the new rule type in `server/routes/api.ts` and in the frontend form in `src/pages/MatchingRules.tsx`.

---

## 4. Migration to Production PostgreSQL (Cloud SQL)

To migrate from the SQLite WASM simulator to managed PostgreSQL:
1. Replace `sql.js` in `server/db/database.ts` with standard `pg` Pool or Drizzle ORM.
2. The logical database model translates directly to PostgreSQL schemas:
   - `DEMO_OPERATIONS_DB` -> `CREATE SCHEMA operations;`
   - `DEMO_RECORDS_DB` -> `CREATE SCHEMA records;`
   - `RECONCILIATION_DB` -> `CREATE SCHEMA reconciliation;`
3. Parameterized queries in `reconciliationEngine.ts` and `jobOrchestrator.ts` require changing parameter placeholders from `?` to `$1, $2, ...`.
