# Reconciliation Studio — Technical Documentation Suite

Welcome to the comprehensive technical documentation for **Reconciliation Studio** (Dynamic Data Reconciliation & Job Management Platform).

All documents are grounded in the actual implemented source code, SQLite WASM database schema, and deterministic matching engine.

---

## Documentation Index

1. **[01. Technical Specification](01-technical-specification.md)**  
   System objectives, functional scope, technology stack, and high-level architecture.

2. **[02. System Architecture](02-system-architecture.md)**  
   Full-stack tiered structure, data flow, sequence diagrams, and identifier sanitization.

3. **[03. Database Design](03-database-design.md)**  
   Entity Relationship Diagram (ERD), logical database isolation, physical table schemas, and dynamic DDL.

4. **[04. Reconciliation Engine Specification](04-reconciliation-engine.md)**  
   10-step deterministic matching algorithm, single/composite keys, duplicate guards, and result taxonomy.

5. **[05. Job Management Specification](05-job-management.md)**  
   Orchestration lifecycle, visual DAG pipeline, concurrency guards, step logging, and cron scheduling.

6. **[06. REST API Specification](06-api-specification.md)**  
   Complete endpoint catalog with JSON request/response payloads, status codes, and error formats.

7. **[07. User Guide & Operating Manual](07-user-guide.md)**  
   Beginner-friendly step-by-step walkthrough of all 13 application pages with actual UI labels.

8. **[08. Step-by-Step Practical Examples](08-step-by-step-examples.md)**  
   Verified Coffee Shop Sales tutorial, One-Click Template Provisioning, and Custom Schema Matching.

9. **[09. Developer Guide](09-developer-guide.md)**  
   Project structure, local installation, build commands, adding new matching rules, and Cloud SQL migration.

10. **[10. Troubleshooting Guide](10-troubleshooting.md)**  
    Diagnostic steps and resolutions for runtime errors, concurrency locks, and schema mismatches.

---

## Additional Resources

- **[OpenAPI 3.1 Specification](openapi.yaml)**: Machine-readable API definition.
- **[Presentation Outline](presentation-outline.md)**: 16-slide presentation deck structure.
- **[Presentation Speaker Notes](presentation-speaker-notes.md)**: Professional word-for-word speaker notes.
- **PowerPoint Slide Deck (`Reconciliation_Studio_Presentation.pptx`)**: Editable 16-slide PowerPoint file downloadable in the application's **Presentations** menu.
