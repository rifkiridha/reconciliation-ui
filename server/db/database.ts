import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: SqlJsDatabase | null = null;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'rms_database.sqlite');

export async function getDb(): Promise<SqlJsDatabase> {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('[DB] Gagal memuat database file yang ada, membuat database baru:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initSystemCatalog(dbInstance);
  persistDb();
  return dbInstance;
}

export function persistDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('[DB] Gagal menyimpan file database SQLite:', err);
  }
}

function initSystemCatalog(db: SqlJsDatabase): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS _rms_databases (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS _rms_tables (
      id TEXT PRIMARY KEY,
      database_id TEXT NOT NULL,
      database_name TEXT NOT NULL,
      table_name TEXT NOT NULL,
      physical_table_name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(database_name, table_name)
    );

    CREATE TABLE IF NOT EXISTS _rms_columns (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      column_name TEXT NOT NULL,
      data_type TEXT NOT NULL,
      max_length INTEGER,
      is_nullable INTEGER NOT NULL DEFAULT 1,
      is_primary_key INTEGER NOT NULL DEFAULT 0,
      is_unique INTEGER NOT NULL DEFAULT 0,
      default_value TEXT,
      ordinal_position INTEGER NOT NULL,
      UNIQUE(table_id, column_name)
    );

    CREATE TABLE IF NOT EXISTS _rms_modules (
      id TEXT PRIMARY KEY,
      module_name TEXT NOT NULL UNIQUE,
      description TEXT,
      module_type TEXT NOT NULL,
      source_database TEXT NOT NULL,
      source_table TEXT NOT NULL,
      target_database TEXT NOT NULL,
      target_table TEXT NOT NULL,
      matching_config TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS _rms_matching_rules (
      id TEXT PRIMARY KEY,
      rule_name TEXT NOT NULL,
      rule_type TEXT NOT NULL,
      description TEXT,
      config TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS _rms_jobs (
      id TEXT PRIMARY KEY,
      job_name TEXT NOT NULL UNIQUE,
      description TEXT,
      module_ids TEXT NOT NULL,
      execution_order TEXT NOT NULL,
      dependencies TEXT,
      retry_limit INTEGER NOT NULL DEFAULT 3,
      timeout_seconds INTEGER NOT NULL DEFAULT 300,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS _rms_job_schedules (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      schedule_name TEXT NOT NULL,
      cron_expression TEXT NOT NULL,
      timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
      is_active INTEGER NOT NULL DEFAULT 1,
      last_execution TEXT,
      next_planned_execution TEXT,
      max_retries INTEGER NOT NULL DEFAULT 3,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS _rms_job_executions (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      job_name TEXT NOT NULL,
      status TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration_ms INTEGER,
      total_source INTEGER DEFAULT 0,
      total_target INTEGER DEFAULT 0,
      matched_count INTEGER DEFAULT 0,
      unmatched_count INTEGER DEFAULT 0,
      error_count INTEGER DEFAULT 0,
      summary_json TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS _rms_execution_logs (
      id TEXT PRIMARY KEY,
      execution_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      log_level TEXT NOT NULL,
      message TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS _rms_reconciliation_results (
      id TEXT PRIMARY KEY,
      execution_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      source_record_id TEXT,
      target_record_id TEXT,
      matching_key TEXT,
      source_amount REAL,
      target_amount REAL,
      difference REAL,
      reconciliation_status TEXT NOT NULL,
      reason TEXT,
      source_data_json TEXT,
      target_data_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS _rms_audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      description TEXT NOT NULL,
      result TEXT NOT NULL
    );
  `);
}

export function generatePhysicalTableName(dbName: string, tableName: string): string {
  const cleanDb = dbName.replace(/[^a-zA-Z0-9_]/g, '').toUpperCase();
  const cleanTable = tableName.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
  return `tbl_${cleanDb}_${cleanTable}`;
}

export function queryAll<T = any>(db: SqlJsDatabase, sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(db: SqlJsDatabase, sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(db, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function executeSql(db: SqlJsDatabase, sql: string, params: any[] = []): void {
  if (!params || params.length === 0) {
    db.run(sql);
  } else {
    const stmt = db.prepare(sql);
    stmt.run(params);
    stmt.free();
  }
  persistDb();
}

export function addAuditLog(
  db: SqlJsDatabase,
  action: string,
  entityType: string,
  entityId: string | null,
  description: string,
  result: 'SUCCESS' | 'FAILED' = 'SUCCESS'
): void {
  const id = 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();
  executeSql(
    db,
    `INSERT INTO _rms_audit_logs (id, timestamp, action, entity_type, entity_id, description, result) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, now, action, entityType, entityId, description, result]
  );
}
