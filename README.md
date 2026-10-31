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

## Deployment

Reconciliation Studio is a full-stack web application: the React frontend and Express API must both be available. **Google Cloud Run is the recommended deployment target.** Firebase App Distribution is intended for mobile application packages, so the Firebase option for this project uses Firebase Hosting for the web frontend and routes `/api` requests to Cloud Run.

### Prerequisites

- Node.js 22 or later and npm
- A Google Cloud project with billing enabled
- The [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
- For the Firebase option, the [Firebase CLI](https://firebase.google.com/docs/cli)

Before deploying, verify the production build locally:

```bash
npm install
npm run build
```

### Option 1: Deploy the full application to Google Cloud Run

Authenticate, select your Google Cloud project, and enable the required APIs:

```bash
gcloud auth login
gcloud config set project YOUR_GOOGLE_CLOUD_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

Deploy directly from the repository source to the Jakarta region:

```bash
gcloud run deploy reconciliation-studio --source . --region asia-southeast2 --allow-unauthenticated --set-env-vars NODE_ENV=production --max-instances 1
```

Cloud Build detects the Node.js application, installs its dependencies, runs the production build, and deploys the service. Obtain the public URL after deployment:

```bash
gcloud run services describe reconciliation-studio --region asia-southeast2 --format="value(status.url)"
```

Open that URL and verify the dashboard and `/api/health` endpoint before adding it to the project submission.

### Option 2: Firebase Hosting frontend with a Cloud Run API

First deploy the Cloud Run service using Option 1. The committed [`firebase.json`](firebase.json) serves the built React application from `dist/`, forwards `/api/**` to the `reconciliation-studio` Cloud Run service in `asia-southeast2`, and sends all other routes to the SPA entry point.

Install and authenticate the Firebase CLI, associate the repository with a Firebase project, then deploy Hosting:

```bash
npm install --global firebase-tools
firebase login
firebase use --add
npm run build
firebase deploy --only hosting
```

If you change the Cloud Run service name or region, update `serviceId` or `region` in `firebase.json` before deploying. The Cloud Run service must remain publicly invokable for the Hosting rewrite used by this demo.

### Demo data persistence

The current demo stores SQLite data on the container filesystem. Cloud Run container filesystems are ephemeral, so data can reset when an instance is replaced. `--max-instances 1` avoids multiple independent SQLite copies running concurrently, but it does not provide durable storage. For production, migrate the data layer to Cloud SQL, Firestore, or another managed persistent database.

---

## Road to DevFest Jakarta 2026 Submission

Submit through the [Road to DevFest Jakarta 2026 project submission guide](https://gdgjakarta.org/road-to-devfest26-submission) and use the Google account registered for the event.

| Deliverable | Location |
|---|---|
| Source code | [github.com/rifkiridha/reconciliation-ui](https://github.com/rifkiridha/reconciliation-ui) |
| Setup and deployment instructions | This README |
| Demo video | [Reconciliation Studio — GDG Jakarta 2026](https://youtu.be/EZDKlLT46FA) |
| Pitch deck | [`Reconciliation_Studio_Presentation.pptx`](Reconciliation_Studio_Presentation.pptx) |
| Technical documentation | [`docs/`](docs/) |
| Live application | Add the Cloud Run or Firebase Hosting URL after deployment |

> **Video timing:** the current demo video is 3 minutes 12 seconds. The event announcement requests a maximum of 3 minutes, while the online submission guide states a maximum of 5 minutes. Trim at least 12 seconds for strict compliance and retain the current version as the backup video.

Before final submission, confirm that the live URL is publicly accessible, the README instructions work from a clean checkout, and all linked video and presentation assets have appropriate sharing permissions.

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
