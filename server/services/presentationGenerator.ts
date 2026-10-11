import pptxgen from 'pptxgenjs';
import fs from 'fs';
import path from 'path';

export async function generatePresentationPptx(): Promise<string> {
  const pptx = new pptxgen();

  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Reconciliation Studio Team';
  pptx.company = 'Reconciliation Studio';
  pptx.title = 'Reconciliation Studio Presentation';
  pptx.subject = 'Dynamic Data Reconciliation & Job Management Platform';

  // Enterprise Color Palette: Navy, Teal, Slate, White
  const C_NAVY = '0F172A';
  const C_DARK_BLUE = '1E293B';
  const C_INDIGO = '4F46E5';
  const C_TEAL = '0D9488';
  const C_EMERALD = '10B981';
  const C_AMBER = 'F59E0B';
  const C_ROSE = 'F43F5E';
  const C_WHITE = 'FFFFFF';
  const C_SLATE_LIGHT = '94A3B8';
  const C_SLATE_BG = 'F8FAFC';

  const addHeader = (slide: any, title: string, subtitle?: string) => {
    slide.addText(title, {
      x: 0.8,
      y: 0.5,
      w: 11.5,
      h: 0.6,
      fontSize: 22,
      fontFace: 'Arial',
      color: C_NAVY,
      bold: true,
    });
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.8,
        y: 1.05,
        w: 11.5,
        h: 0.35,
        fontSize: 12,
        fontFace: 'Arial',
        color: C_TEAL,
      });
    }
    // Top border accent line
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: 1.4,
      w: 11.7,
      h: 0.02,
      fill: { color: 'E2E8F0' },
      line: { color: 'E2E8F0' },
    });
  };

  const addFooter = (slide: any, pageNum: number) => {
    slide.addText(`Reconciliation Studio — Technical Architecture & Overview | Slide ${pageNum}`, {
      x: 0.8,
      y: 7.0,
      w: 10.0,
      h: 0.3,
      fontSize: 9,
      fontFace: 'Arial',
      color: C_SLATE_LIGHT,
    });
  };

  // ==========================================
  // SLIDE 1: Title Slide
  // ==========================================
  const slide1 = pptx.addSlide();
  slide1.background = { color: C_NAVY };

  slide1.addShape(pptx.ShapeType.rect, {
    x: 1.0,
    y: 2.0,
    w: 0.15,
    h: 2.5,
    fill: { color: C_TEAL },
    line: { color: C_TEAL }
  });

  slide1.addText('Reconciliation Studio', {
    x: 1.4,
    y: 2.0,
    w: 10.5,
    h: 1.0,
    fontSize: 40,
    fontFace: 'Arial',
    bold: true,
    color: C_WHITE,
  });

  slide1.addText('Dynamic Data Reconciliation & Job Management Platform', {
    x: 1.4,
    y: 3.0,
    w: 10.5,
    h: 0.6,
    fontSize: 20,
    fontFace: 'Arial',
    color: '38BDF8',
  });

  slide1.addText('Enterprise Architecture • Deterministic Rule Engine • Template Provisioning • Audit Integrity', {
    x: 1.4,
    y: 3.7,
    w: 10.5,
    h: 0.4,
    fontSize: 13,
    fontFace: 'Arial',
    color: C_SLATE_LIGHT,
  });

  slide1.addText(`Target Audience: Solution Architects, Developers, Technical Leads, QA & Operations\nDate: October 2026 | Simulation Environment: SQLite WASM Embedded Engine`, {
    x: 1.4,
    y: 5.6,
    w: 10.5,
    h: 0.8,
    fontSize: 11,
    fontFace: 'Arial',
    color: '64748B',
  });

  slide1.addNotes('Welcome everyone. Today we are presenting Reconciliation Studio, a dynamic data reconciliation and job orchestration platform designed to automate transaction matching, financial settlement verification, and inventory audits.');

  // ==========================================
  // SLIDE 2: Background & Problem Statement
  // ==========================================
  const slide2 = pptx.addSlide();
  addHeader(slide2, 'Background & Problem Statement', 'Challenges in Multi-Source Enterprise Data Reconciliation');
  addFooter(slide2, 2);

  slide2.addText('Traditional reconciliation workflows rely on manual spreadsheets, rigid SQL scripts, or opaque black-box tools with little transparency and significant operational overhead.', {
    x: 0.8,
    y: 1.6,
    w: 11.5,
    h: 0.5,
    fontSize: 12,
    fontFace: 'Arial',
    color: '334155',
  });

  const pPoints = [
    { title: 'Siloed Heterogeneous Databases', desc: 'Operational systems (POS, ERP, Web) and settlement ledgers (Gateways, Bank Statements) live in isolated databases with differing schemas.' },
    { title: 'Manual & Error-Prone Matching', desc: 'Manual VLOOKUPs and ad-hoc scripts fail to detect ambiguous duplicates, cut-off date shifts, or currency precision discrepancies.' },
    { title: 'Lack of Dynamic Scalability', desc: 'Introducing a new reconciliation module historically required writing new backend services, schema migrations, and custom cron scripts.' },
    { title: 'Opaque Auditing & Investigation', desc: 'Operations teams lack side-by-side visibility to understand exactly why a transaction failed, mismatched, or remained unmatched.' }
  ];

  pPoints.forEach((p, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.8 + col * 5.9;
    const y = 2.4 + row * 2.1;

    slide2.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 5.6,
      h: 1.8,
      fill: { color: 'F1F5F9' },
      line: { color: 'CBD5E1', width: 1 },
    });

    slide2.addText(`0${idx + 1}. ${p.title}`, {
      x: x + 0.3,
      y: y + 0.2,
      w: 5.0,
      h: 0.35,
      fontSize: 13,
      fontFace: 'Arial',
      bold: true,
      color: C_NAVY,
    });

    slide2.addText(p.desc, {
      x: x + 0.3,
      y: y + 0.6,
      w: 5.0,
      h: 1.0,
      fontSize: 11,
      fontFace: 'Arial',
      color: '475569',
    });
  });

  slide2.addNotes('Here we articulate the core pain points: data silos, manual matching errors, slow onboarding of new reconciliation modules, and lack of detailed audit trails.');

  // ==========================================
  // SLIDE 3: Application Overview
  // ==========================================
  const slide3 = pptx.addSlide();
  addHeader(slide3, 'Application Overview', 'End-to-End Dynamic Reconciliation Lifecycle');
  addFooter(slide3, 3);

  const steps = [
    { num: '1', title: 'Data Management', desc: 'Create logical databases, define dynamic physical tables, and import CSV or operational records.' },
    { num: '2', title: 'Module Templates', desc: 'One-click provision modules: auto-generate source/target tables, matching configs, and jobs.' },
    { num: '3', title: 'Matching Engine', desc: 'Deterministic 1:1 matching, exact keys, tolerance bounds, duplicate guards, and status mapping.' },
    { num: '4', title: 'Job Orchestration', desc: 'Assemble pipeline DAGs, configure retry limits, timeout thresholds, and scheduled triggers.' },
    { num: '5', title: 'Results & Compliance', desc: 'Inspect side-by-side transaction differences, review execution step logs, and export CSV reports.' }
  ];

  steps.forEach((s, idx) => {
    const x = 0.8 + idx * 2.38;
    slide3.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 2.0,
      w: 2.2,
      h: 4.5,
      fill: { color: idx === 2 ? 'EEF2FF' : C_SLATE_BG },
      line: { color: idx === 2 ? C_INDIGO : 'CBD5E1', width: idx === 2 ? 2 : 1 },
    });

    slide3.addText(s.num, {
      x: x + 0.2,
      y: 2.3,
      w: 0.6,
      h: 0.6,
      fontSize: 18,
      fontFace: 'Arial',
      bold: true,
      color: idx === 2 ? C_INDIGO : C_TEAL,
    });

    slide3.addText(s.title, {
      x: x + 0.2,
      y: 3.1,
      w: 1.8,
      h: 0.6,
      fontSize: 13,
      fontFace: 'Arial',
      bold: true,
      color: C_NAVY,
    });

    slide3.addText(s.desc, {
      x: x + 0.2,
      y: 3.8,
      w: 1.8,
      h: 2.3,
      fontSize: 11,
      fontFace: 'Arial',
      color: '475569',
    });
  });

  slide3.addNotes('Reconciliation Studio covers the full lifecycle: from database definition, template-driven module creation, to deterministic rule execution, job orchestration, and detailed side-by-side compliance reporting.');

  // ==========================================
  // SLIDE 4: Key Features Matrix
  // ==========================================
  const slide4 = pptx.addSlide();
  addHeader(slide4, 'Core Platform Capabilities', 'Implemented Features vs Production Roadmap');
  addFooter(slide4, 4);

  const featureRows = [
    ['Feature Module', 'Implemented Capabilities', 'Technology / Engine', 'Status'],
    ['Database Manager', 'Hierarchical DB tree, physical table inspector, CSV import/export, read-only SQL query runner', 'SQLite WASM (sql.js) / Physical Tables', 'Verified Operational'],
    ['Dynamic Table Designer', 'No-code DDL generator: UUID, VARCHAR, DECIMAL, DATE, PK, Unique, Nullable constraints', 'Safe Identifier Validation & Real DDL', 'Verified Operational'],
    ['Module Templates', 'One-click auto-provisioning: generates source & target tables, matching rules, job, & sample data', 'Configurable Business Template Factory', 'Verified Operational'],
    ['Deterministic Engine', '1:1 matching, duplicate candidate isolation, absolute tolerance, cut-off date checks, status sync', 'In-Engine Deterministic Algorithm', 'Verified Operational'],
    ['Job Orchestration', 'Sequential pipeline steps, dependency verification, concurrency lock, execution retry limit', 'In-Process Orchestrator & Run Now', 'Verified Operational'],
    ['Side-by-Side Results', 'Interactive row comparison: Source vs Target side-by-side, highlight differences, CSV export', 'Consolidated Result Catalog & CSV Exporter', 'Verified Operational'],
    ['Job Scheduler', 'Cron expression editor, timezone selection, ad-hoc execution trigger, simulation mode notice', 'Preview Best-Effort Scheduler', 'Simulated Preview'],
    ['Cloud SQL / Auth', 'External PostgreSQL connector, multi-tenant RBAC, enterprise durable worker queues', 'Cloud SQL / OAuth / Cloud Tasks', 'Roadmap Architecture']
  ];

  slide4.addTable(featureRows, {
    x: 0.8,
    y: 1.8,
    w: 11.7,
    colW: [2.2, 5.3, 2.5, 1.7],
    fontSize: 9.5,
    fontFace: 'Arial',
    color: '334155',
    fill: { color: 'F8FAFC' },
    border: { pt: 0.5, color: 'CBD5E1' },
    align: 'left',
  });

  slide4.addNotes('This matrix clearly distinguishes between what is implemented and verified operational versus simulated features and future roadmap extensions.');

  // ==========================================
  // SLIDE 5: System Architecture
  // ==========================================
  const slide5 = pptx.addSlide();
  addHeader(slide5, 'System Architecture', 'Multi-Layer Full-Stack Enterprise Stack');
  addFooter(slide5, 5);

  const layers = [
    { name: 'Frontend Layer (React 19 + TypeScript + Tailwind CSS)', desc: 'SPA Dashboard, Interactive Data Explorer, Visual DAG Pipeline Designer, Side-by-Side Results Modal, Markdown Doc Viewer' },
    { name: 'API & Orchestration Layer (Express + Node.js + TypeScript)', desc: 'REST API Endpoints (/api/databases, /api/tables, /api/modules, /api/jobs, /api/reconciliation-results), Request Validation (Zod)' },
    { name: 'Core Engine Layer (Deterministic Reconciliation & Workflow)', desc: 'One-to-One Matcher, Key Normalizer, Ambiguous Duplicate Detector, Tolerance Evaluator, Concurrency Lock' },
    { name: 'Database & Storage Layer (SQLite WASM Embedded Simulator)', desc: 'Physical Tables (tbl_<DB>_<table>), System Metadata Catalog (_rms_databases, _rms_tables, _rms_modules, _rms_results), File Buffer Sync' }
  ];

  layers.forEach((l, idx) => {
    slide5.addShape(pptx.ShapeType.roundRect, {
      x: 1.2,
      y: 1.8 + idx * 1.25,
      w: 10.8,
      h: 1.05,
      fill: { color: idx === 2 ? 'EEF2FF' : 'F1F5F9' },
      line: { color: idx === 2 ? C_INDIGO : '94A3B8', width: 1.5 }
    });

    slide5.addText(l.name, {
      x: 1.5,
      y: 1.95 + idx * 1.25,
      w: 10.2,
      h: 0.35,
      fontSize: 12,
      fontFace: 'Arial',
      bold: true,
      color: idx === 2 ? C_INDIGO : C_NAVY,
    });

    slide5.addText(l.desc, {
      x: 1.5,
      y: 2.35 + idx * 1.25,
      w: 10.2,
      h: 0.45,
      fontSize: 10,
      fontFace: 'Arial',
      color: '475569',
    });
  });

  slide5.addNotes('The architecture follows a modular, decoupled pattern: React SPA frontend, Express REST API, a pure TypeScript deterministic reconciliation engine, and SQLite WASM storage.');

  // ==========================================
  // SLIDE 6: Database Architecture & Catalog
  // ==========================================
  const slide6 = pptx.addSlide();
  addHeader(slide6, 'Database Design & Schema Isolation', 'Logical Database Separation with Safe Physical Table Naming');
  addFooter(slide6, 6);

  slide6.addText('Logical databases are isolated in SQLite via dedicated naming conventions and a central schema catalog.', {
    x: 0.8,
    y: 1.6,
    w: 11.5,
    h: 0.4,
    fontSize: 12,
    fontFace: 'Arial',
    color: '334155',
  });

  const dbs = [
    { name: 'DEMO_OPERATIONS_DB', color: 'E0E7FF', border: C_INDIGO, tables: ['coffee_orders (POS Orders)', 'bookstore_orders (Sales Invoices)', 'ticket_bookings (Concert Tickets)', 'warehouse_movements (Inventory Logs)'] },
    { name: 'DEMO_RECORDS_DB', color: 'CCFBF1', border: C_TEAL, tables: ['coffee_payments (QRIS/EDC Gateways)', 'bookstore_sales (Cashier Ledgers)', 'ticket_payments (Ticketing Gateways)', 'inventory_records (Stock Opname Audits)'] },
    { name: 'RECONCILIATION_DB', color: 'FEF3C7', border: C_AMBER, tables: ['_rms_databases & _rms_tables', '_rms_modules & _rms_jobs', '_rms_job_executions & _rms_logs', '_rms_reconciliation_results & audit'] }
  ];

  dbs.forEach((d, idx) => {
    const x = 0.8 + idx * 3.95;
    slide6.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 2.2,
      w: 3.75,
      h: 4.4,
      fill: { color: C_SLATE_BG },
      line: { color: d.border, width: 2 },
    });

    slide6.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.2,
      y: 2.4,
      w: 3.35,
      h: 0.5,
      fill: { color: d.color },
      line: { color: d.border, width: 1 },
    });

    slide6.addText(d.name, {
      x: x + 0.2,
      y: 2.45,
      w: 3.35,
      h: 0.4,
      fontSize: 11,
      fontFace: 'Arial',
      bold: true,
      color: C_NAVY,
      align: 'center',
    });

    d.tables.forEach((tbl, tIdx) => {
      slide6.addShape(pptx.ShapeType.roundRect, {
        x: x + 0.2,
        y: 3.1 + tIdx * 0.8,
        w: 3.35,
        h: 0.65,
        fill: { color: 'FFFFFF' },
        line: { color: 'E2E8F0', width: 1 },
      });

      slide6.addText(tbl, {
        x: x + 0.3,
        y: 3.15 + tIdx * 0.8,
        w: 3.15,
        h: 0.55,
        fontSize: 10,
        fontFace: 'Arial',
        color: '1E293B',
      });
    });
  });

  slide6.addNotes('This slide showcases how DEMO_OPERATIONS_DB, DEMO_RECORDS_DB, and RECONCILIATION_DB are organized with physical table isolation.');

  // ==========================================
  // SLIDE 7: Template-Based Module Creation
  // ==========================================
  const slide7 = pptx.addSlide();
  addHeader(slide7, 'Template-Based Module Creation', 'Rapid Zero-Code Onboarding for New Business Scenarios');
  addFooter(slide7, 7);

  slide7.addText('Users can enter a human-readable business scenario name (e.g., "Restaurant Orders") and select a template. The platform automatically orchestrates the entire stack in one click.', {
    x: 0.8,
    y: 1.6,
    w: 11.5,
    h: 0.5,
    fontSize: 12,
    fontFace: 'Arial',
    color: '334155',
  });

  const tmplSteps = [
    { title: 'User Input', desc: 'Enter Name: "Bakery Orders"\nSelect Template: Order-to-Payment' },
    { title: 'Auto-Provision Tables', desc: 'Creates bakery_orders_source\nCreates bakery_orders_target' },
    { title: 'Configure Rules', desc: 'order_id = order_id\nAmount tolerance: 0.00\nDate sync: 0 days' },
    { title: 'Generate Job', desc: 'JOB_BAKERY_ORDERS_RECON\nPipeline steps & retry limits' },
    { title: 'Seed Sample Data', desc: 'Populates 8 test records\nReady to Run immediately!' }
  ];

  tmplSteps.forEach((ts, idx) => {
    const x = 0.8 + idx * 2.38;
    slide7.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 2.4,
      w: 2.2,
      h: 3.8,
      fill: { color: 'FFFFFF' },
      line: { color: C_INDIGO, width: 1.5 },
    });

    slide7.addText(`Step ${idx + 1}`, {
      x: x + 0.15,
      y: 2.6,
      w: 1.9,
      h: 0.3,
      fontSize: 11,
      fontFace: 'Arial',
      bold: true,
      color: C_TEAL,
    });

    slide7.addText(ts.title, {
      x: x + 0.15,
      y: 3.0,
      w: 1.9,
      h: 0.5,
      fontSize: 13,
      fontFace: 'Arial',
      bold: true,
      color: C_NAVY,
    });

    slide7.addText(ts.desc, {
      x: x + 0.15,
      y: 3.6,
      w: 1.9,
      h: 2.2,
      fontSize: 10.5,
      fontFace: 'Arial',
      color: '475569',
    });
  });

  slide7.addNotes('Template-based provisioning allows non-technical users to onboard new business reconciliation modules in seconds without writing SQL or backend code.');

  // ==========================================
  // SLIDE 8: Reconciliation Engine Algorithm
  // ==========================================
  const slide8 = pptx.addSlide();
  addHeader(slide8, 'Reconciliation Engine Flow', 'Deterministic 10-Step Processing Sequence');
  addFooter(slide8, 8);

  const engineSteps = [
    '1. Validate Module Config',
    '2. Check Physical Tables',
    '3. Load Source Rows',
    '4. Load Target Rows',
    '5. Normalize Values',
    '6. Generate Keys',
    '7. Isolate Duplicates',
    '8. One-to-One Match',
    '9. Compare Attributes',
    '10. Commit Results & Stats'
  ];

  engineSteps.forEach((st, idx) => {
    const col = idx % 5;
    const row = Math.floor(idx / 5);
    const x = 0.8 + col * 2.38;
    const y = 2.0 + row * 2.2;

    slide8.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 2.2,
      h: 1.8,
      fill: { color: C_SLATE_BG },
      line: { color: C_TEAL, width: 1.5 },
    });

    slide8.addText(st, {
      x: x + 0.15,
      y: y + 0.3,
      w: 1.9,
      h: 0.5,
      fontSize: 12,
      fontFace: 'Arial',
      bold: true,
      color: C_NAVY,
    });

    slide8.addText(
      idx === 6 ? 'Duplicate keys flagged ambiguous to prevent false claims.' :
      idx === 7 ? 'Strict 1:1 consumption: each target record consumed only once.' :
      idx === 8 ? 'Evaluates amount tolerance, cut-off date, and status parity.' :
      'Validated and persisted inside database catalog.',
      {
        x: x + 0.15,
        y: y + 0.85,
        w: 1.9,
        h: 0.8,
        fontSize: 9.5,
        fontFace: 'Arial',
        color: '64748B',
      }
    );
  });

  slide8.addNotes('This slide walks through the 10 sequential execution steps of the reconciliation algorithm, emphasizing duplicate isolation and 1:1 matching constraints.');

  // ==========================================
  // SLIDE 9: Matching Rules & Status Classification
  // ==========================================
  const slide9 = pptx.addSlide();
  addHeader(slide9, 'Matching Rules & Status Classification', 'Deterministic Result Taxonomy');
  addFooter(slide9, 9);

  const statusRows = [
    ['Status Code', 'Evaluation Condition', 'Business Interpretation', 'Action Required'],
    ['MATCHED', 'Keys match, amount diff <= tolerance, dates match, statuses identical', 'Clean transaction (100% matched)', 'Ready for final settlement ledger'],
    ['AMOUNT_MISMATCH', 'Keys match, but absolute nominal difference exceeds tolerance', 'Discrepancy in monetary value / discount', 'Operational review for fees/adjustments'],
    ['DATE_MISMATCH', 'Keys match, but transaction dates differ past tolerance days', 'Timing cut-off difference across platforms', 'Verify settlement cut-off window'],
    ['STATUS_MISMATCH', 'Keys match, but operational status differs (e.g. SUCCESS vs FAILED)', 'Asynchronous state desynchronization', 'Investigate gateway timeout or reversal'],
    ['DUPLICATE', 'Reconciliation key appears multiple times in source or target', 'Duplicate posting attempt / ambiguous key', 'Isolate records to prevent double claim'],
    ['SOURCE_ONLY', 'Present in source system, completely missing in target ledger', 'Unsettled or abandoned order', 'Query target gateway or cancel order'],
    ['TARGET_ONLY', 'Present in settlement target, absent from operational source', 'Unmatched charge or orphan credit', 'Investigate orphan transaction log'],
    ['PENDING', 'Transaction status marked as PENDING in either system', 'Awaiting batch settlement or clearing', 'Re-run reconciliation on next cycle']
  ];

  slide9.addTable(statusRows, {
    x: 0.8,
    y: 1.8,
    w: 11.7,
    colW: [2.0, 4.2, 3.0, 2.5],
    fontSize: 9,
    fontFace: 'Arial',
    color: '334155',
    fill: { color: 'F8FAFC' },
    border: { pt: 0.5, color: 'CBD5E1' },
    align: 'left',
  });

  slide9.addNotes('Every reconciliation result is assigned a deterministic status code. Here we document all 8 supported classification outcomes.');

  // ==========================================
  // SLIDE 10: Job Management & Orchestration
  // ==========================================
  const slide10 = pptx.addSlide();
  addHeader(slide10, 'Job Orchestration & Lifecycle', 'Execution Tracking, Step Logs, and Idempotency');
  addFooter(slide10, 10);

  const jobPoints = [
    { title: 'Sequential Step DAG', desc: 'Jobs assemble ordered execution pipelines: Extract -> Normalize -> Reconcile -> Summarize -> Export.' },
    { title: 'Concurrency Locking', desc: 'In-process execution lock prevents duplicate concurrent runs of the same job to protect data integrity.' },
    { title: 'Step-by-Step Logging', desc: 'Real backend execution events stream to _rms_execution_logs with INFO, WARN, ERROR, and SUCCESS levels.' },
    { title: 'Retry & Failure Recovery', desc: 'Configurable retry limit and execution timeout thresholds with detailed error stack capture.' }
  ];

  jobPoints.forEach((jp, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.8 + col * 5.9;
    const y = 2.0 + row * 2.2;

    slide10.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 5.6,
      h: 1.9,
      fill: { color: C_SLATE_BG },
      line: { color: C_INDIGO, width: 1.5 },
    });

    slide10.addText(jp.title, {
      x: x + 0.3,
      y: y + 0.25,
      w: 5.0,
      h: 0.35,
      fontSize: 13,
      fontFace: 'Arial',
      bold: true,
      color: C_NAVY,
    });

    slide10.addText(jp.desc, {
      x: x + 0.3,
      y: y + 0.65,
      w: 5.0,
      h: 1.0,
      fontSize: 11,
      fontFace: 'Arial',
      color: '475569',
    });
  });

  slide10.addNotes('Jobs manage execution state, enforce concurrency safety, collect structured step logs, and track execution duration.');

  // ==========================================
  // SLIDE 11: Practical Example — Coffee Shop Sales
  // ==========================================
  const slide11 = pptx.addSlide();
  addHeader(slide11, 'Verified Example: Coffee Shop Sales', 'Real Scenario Reconciling POS Orders vs Payment Gateway');
  addFooter(slide11, 11);

  slide11.addText('Source: DEMO_OPERATIONS_DB.coffee_orders  vs  Target: DEMO_RECORDS_DB.coffee_payments', {
    x: 0.8,
    y: 1.6,
    w: 11.5,
    h: 0.35,
    fontSize: 12,
    fontFace: 'Arial',
    bold: true,
    color: C_INDIGO,
  });

  const srcTable = [
    ['order_id', 'order_date', 'order_amount', 'customer_name', 'status'],
    ['CF-202610-001', '2026-10-01', 'Rp 48.000', 'Budi Santoso', 'COMPLETED'],
    ['CF-202610-005', '2026-10-01', 'Rp 75.000', 'Rudi Hermawan', 'COMPLETED'],
    ['CF-202610-006', '2026-10-01', 'Rp 62.000', 'Fitri Handayani', 'COMPLETED'],
    ['CF-202610-007', '2026-10-01', 'Rp 88.000', 'Hendra Gunawan', 'COMPLETED'],
    ['CF-202610-010', '2026-10-01', 'Rp 95.000', 'Lia Anggraini', 'COMPLETED']
  ];

  const tgtTable = [
    ['order_id', 'payment_date', 'paid_amount', 'payment_method', 'status'],
    ['CF-202610-001', '2026-10-01', 'Rp 48.000', 'QRIS', 'COMPLETED'],
    ['CF-202610-005', '2026-10-01', 'Rp 70.000', 'QRIS', 'COMPLETED'],
    ['CF-202610-006', '2026-10-02', 'Rp 62.000', 'QRIS', 'COMPLETED'],
    ['CF-202610-007', '2026-10-01', 'Rp 88.000', 'EDC_CREDIT', 'REFUNDED'],
    ['CF-202610-011', '2026-10-01', 'Rp 45.000', 'EDC_DEBIT', 'COMPLETED']
  ];

  slide11.addTable(srcTable, {
    x: 0.8,
    y: 2.1,
    w: 5.6,
    colW: [1.3, 1.0, 1.1, 1.2, 1.0],
    fontSize: 8.5,
    fontFace: 'Arial',
    fill: { color: 'FFFFFF' },
    border: { pt: 0.5, color: 'CBD5E1' }
  });

  slide11.addTable(tgtTable, {
    x: 6.8,
    y: 2.1,
    w: 5.6,
    colW: [1.3, 1.0, 1.1, 1.2, 1.0],
    fontSize: 8.5,
    fontFace: 'Arial',
    fill: { color: 'FFFFFF' },
    border: { pt: 0.5, color: 'CBD5E1' }
  });

  slide11.addText('Matching Rule: order_id = order_id | Comparisons: order_amount = paid_amount, order_date = payment_date, status = status', {
    x: 0.8,
    y: 5.8,
    w: 11.5,
    h: 0.5,
    fontSize: 11,
    fontFace: 'Arial',
    bold: true,
    color: C_TEAL,
  });

  slide11.addNotes('This slide presents the exact test dataset used for the verified Coffee Shop Sales module, displaying corresponding source and target attributes.');

  // ==========================================
  // SLIDE 12: Actual Verification Results
  // ==========================================
  const slide12 = pptx.addSlide();
  addHeader(slide12, 'Verified Execution Results', 'Actual Results from Runtime Execution of JOB_COFFEE_SALES_RECON');
  addFooter(slide12, 12);

  const resData = [
    ['Reference No / Key', 'Classification Status', 'Source Nominal', 'Target Nominal', 'Difference', 'System Diagnostic Reason'],
    ['CF-202610-001', 'MATCHED', 'Rp 48.000', 'Rp 48.000', 'Rp 0', 'Transaksi cocok sempurna (100% Match)'],
    ['CF-202610-005', 'AMOUNT_MISMATCH', 'Rp 75.000', 'Rp 70.000', 'Rp 5.000', 'Selisih nominal (order_amount): Rp 75.000 vs Rp 70.000 (Selisih: 5.000)'],
    ['CF-202610-006', 'DATE_MISMATCH', 'Rp 62.000', 'Rp 62.000', 'Rp 0', 'Perbedaan tanggal (order_date): 2026-10-01 vs 2026-10-02'],
    ['CF-202610-007', 'STATUS_MISMATCH', 'Rp 88.000', 'Rp 88.000', 'Rp 0', 'Status tidak selaras: COMPLETED vs REFUNDED'],
    ['CF-202610-008', 'PENDING', 'Rp 40.000', 'Rp 40.000', 'Rp 0', 'Status transaksi masih menunggu konfirmasi settlement (PENDING)'],
    ['CF-202610-009', 'DUPLICATE', 'Rp 52.000', 'Rp 52.000', 'Rp 0', 'Duplikasi kunci pada data sumber (2 record ditemukan dengan key)'],
    ['CF-202610-010', 'SOURCE_ONLY', 'Rp 95.000', '—', 'Rp 95.000', 'Catatan tercatat pada sumber namun tidak ditemukan pada target'],
    ['CF-202610-011', 'TARGET_ONLY', '—', 'Rp 45.000', 'Rp -45.000', 'Catatan terdapat pada target namun tidak ditemukan pada sumber']
  ];

  slide12.addTable(resData, {
    x: 0.8,
    y: 1.8,
    w: 11.7,
    colW: [1.7, 1.8, 1.3, 1.3, 1.1, 4.5],
    fontSize: 8.5,
    fontFace: 'Arial',
    color: '334155',
    fill: { color: 'F8FAFC' },
    border: { pt: 0.5, color: 'CBD5E1' }
  });

  slide12.addNotes('These are the actual verified outcomes produced by the deterministic reconciliation engine. Every category is accounted for.');

  // ==========================================
  // SLIDE 13: Application Demonstration Walkthrough
  // ==========================================
  const slide13 = pptx.addSlide();
  addHeader(slide13, 'Interactive User Walkthrough', '10-Step Operational User Journey');
  addFooter(slide13, 13);

  const demoSteps = [
    '1. Open Reconciliation Studio Dashboard & inspect active KPIs.',
    '2. Navigate to Database Manager to view DEMO_OPERATIONS_DB & DEMO_RECORDS_DB.',
    '3. Launch Dynamic Table Designer to inspect or customize table schemas.',
    '4. Explore data rows in Data Explorer: filter, sort, search, or add records.',
    '5. Click "Buat dari Template" in Reconciliation Modules for 1-click provisioning.',
    '6. Review deterministic comparison rules in Matching Rules engine.',
    '7. Open Job Designer to visualize the pipeline DAG and execution order.',
    '8. Click "Run Now" to execute the job via real in-process engine.',
    '9. Inspect side-by-side transaction differences in Reconciliation Results.',
    '10. Export compliance-ready CSV reports in Reports & Export.'
  ];

  demoSteps.forEach((ds, idx) => {
    const col = idx < 5 ? 0 : 1;
    const row = idx % 5;
    const x = 0.8 + col * 5.9;
    const y = 2.0 + row * 0.95;

    slide13.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 5.6,
      h: 0.8,
      fill: { color: C_SLATE_BG },
      line: { color: 'CBD5E1', width: 1 }
    });

    slide13.addText(ds, {
      x: x + 0.2,
      y: y + 0.15,
      w: 5.2,
      h: 0.5,
      fontSize: 10.5,
      fontFace: 'Arial',
      color: C_NAVY,
      bold: idx === 7 || idx === 8
    });
  });

  slide13.addNotes('This 10-step guided tour demonstrates how any user can operate the platform from start to finish.');

  // ==========================================
  // SLIDE 14: Technical Benefits & Extensibility
  // ==========================================
  const slide14 = pptx.addSlide();
  addHeader(slide14, 'Technical Benefits & Architecture Value', 'Enterprise Readiness & Extensibility');
  addFooter(slide14, 14);

  const benefits = [
    { title: 'Zero Hardcoded Scenarios', desc: 'The reconciliation engine is completely generic and dynamic. Field mappings, tolerances, and data types are entirely metadata-driven.' },
    { title: 'Deterministic Reproducibility', desc: 'No stochastic or probabilistic hallucinations. 100% predictable matching outcomes with exact mathematical audit logs.' },
    { title: 'Zero External Server Dependency', desc: 'Runs instantly inside Google AI Studio preview via WebAssembly SQLite without mandatory external database provisioning.' },
    { title: 'Future-Proof PostgreSQL Path', desc: 'Table catalog, SQL DDL generation, and transaction handling are fully compatible with external Cloud SQL PostgreSQL migration.' }
  ];

  benefits.forEach((b, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.8 + col * 5.9;
    const y = 2.2 + row * 2.2;

    slide14.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 5.6,
      h: 1.9,
      fill: { color: C_SLATE_BG },
      line: { color: C_TEAL, width: 1.5 },
    });

    slide14.addText(b.title, {
      x: x + 0.3,
      y: y + 0.25,
      w: 5.0,
      h: 0.35,
      fontSize: 13,
      fontFace: 'Arial',
      bold: true,
      color: C_NAVY,
    });

    slide14.addText(b.desc, {
      x: x + 0.3,
      y: y + 0.65,
      w: 5.0,
      h: 1.0,
      fontSize: 11,
      fontFace: 'Arial',
      color: '475569',
    });
  });

  slide14.addNotes('Summarizes technical strengths: metadata-driven flexibility, 100% deterministic rules, zero-dependency preview execution, and direct migration path to Cloud SQL.');

  // ==========================================
  // SLIDE 15: Limitations & Future Enhancements
  // ==========================================
  const slide15 = pptx.addSlide();
  addHeader(slide15, 'Limitations & Production Roadmap', 'Transparent Technical Boundaries');
  addFooter(slide15, 15);

  const limRows = [
    ['Dimension', 'Current Simulation Mode', 'Planned Production Enhancement'],
    ['Database Storage', 'In-container SQLite file buffer (data/rms_database.sqlite)', 'Google Cloud SQL (Managed PostgreSQL) with auto-scaling'],
    ['Scheduler Durability', 'In-process timer (requires active server runtime)', 'Google Cloud Scheduler & Cloud Tasks worker queue'],
    ['Authentication / RBAC', 'Open simulation access (no login required for demo)', 'Firebase Auth / Google Workspace OAuth with role-based permissions'],
    ['Data Ingestion Volume', 'Optimized for up to tens of thousands of records in memory', 'Streaming chunked ETL pipeline with distributed worker pods'],
    ['Alerting & Telemetry', 'In-app execution history logs and audit table', 'Cloud Monitoring, Slack/Webhook webhooks on reconciliation failures']
  ];

  slide15.addTable(limRows, {
    x: 0.8,
    y: 1.8,
    w: 11.7,
    colW: [2.2, 4.5, 5.0],
    fontSize: 9.5,
    fontFace: 'Arial',
    color: '334155',
    fill: { color: 'F8FAFC' },
    border: { pt: 0.5, color: 'CBD5E1' }
  });

  slide15.addNotes('Transparently explains simulation vs production differences: container storage, scheduler durability, and scale boundaries.');

  // ==========================================
  // SLIDE 16: Conclusion & Q&A
  // ==========================================
  const slide16 = pptx.addSlide();
  slide16.background = { color: C_NAVY };

  slide16.addText('Configure. Execute. Reconcile. Analyze.', {
    x: 1.0,
    y: 2.2,
    w: 11.0,
    h: 0.8,
    fontSize: 32,
    fontFace: 'Arial',
    bold: true,
    color: '38BDF8',
    align: 'center',
  });

  slide16.addText('Reconciliation Studio delivers a complete, verifiable foundation for enterprise transaction matching, automated settlement audits, and job orchestration.', {
    x: 2.0,
    y: 3.2,
    w: 9.0,
    h: 0.8,
    fontSize: 14,
    fontFace: 'Arial',
    color: C_SLATE_LIGHT,
    align: 'center',
  });

  slide16.addText('Thank You!\nQuestions & Discussion', {
    x: 2.0,
    y: 4.5,
    w: 9.0,
    h: 1.2,
    fontSize: 24,
    fontFace: 'Arial',
    bold: true,
    color: C_WHITE,
    align: 'center',
  });

  slide16.addText('Reconciliation Studio v2.5 Enterprise Simulator • Live in Google AI Studio', {
    x: 2.0,
    y: 6.2,
    w: 9.0,
    h: 0.4,
    fontSize: 11,
    fontFace: 'Arial',
    color: '64748B',
    align: 'center',
  });

  slide16.addNotes('Conclusion slide. Thank the audience and open the floor for technical questions regarding the architecture, engine, or schema design.');

  // Save PPTX to disk
  const outputPath = path.resolve(process.cwd(), 'Reconciliation_Studio_Presentation.pptx');
  await pptx.writeFile({ fileName: outputPath });

  // Also copy to public directory if exists or ensure public directory exists
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.copyFileSync(outputPath, path.join(publicDir, 'Reconciliation_Studio_Presentation.pptx'));

  return outputPath;
}
