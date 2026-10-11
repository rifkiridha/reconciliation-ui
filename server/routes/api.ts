import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  getDb,
  queryAll,
  queryOne,
  executeSql,
  generatePhysicalTableName,
  addAuditLog
} from '../db/database.js';
import { seedInitialData } from '../db/seed.js';
import { runJob } from '../services/jobOrchestrator.js';

export const apiRouter = Router();

// ==========================================
// 1. HEALTH & SYSTEM
// ==========================================
apiRouter.get('/health', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const dbCount = queryOne<{ count: number }>(db, `SELECT COUNT(*) as count FROM _rms_databases`);
    res.json({
      status: 'HEALTHY',
      app: 'Reconciliation Studio',
      subtitle: 'Dynamic Data Reconciliation & Job Management Platform',
      engine: 'SQLite WASM Embedded Simulator',
      storageNotice: 'Data tersimpan dalam container lokal SQLite file. Bukan penyimpanan PostgreSQL eksternal permanen.',
      databaseCount: dbCount?.count || 0,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/system/reset', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    seedInitialData(db, true);
    res.json({ success: true, message: 'Database dan dataset demo berhasil di-reset ke kondisi awal.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. DATABASE MANAGER
// ==========================================
apiRouter.get('/databases', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const databases = queryAll(db, `SELECT * FROM _rms_databases ORDER BY name ASC`);
    
    // Attach tables for each database
    const result = databases.map(d => {
      const tables = queryAll(db, `SELECT * FROM _rms_tables WHERE database_name = ? ORDER BY table_name ASC`, [d.name]);
      const tablesWithCount = tables.map(t => {
        let rowCount = 0;
        try {
          const countRes = queryOne<{ count: number }>(db, `SELECT COUNT(*) as count FROM ${t.physical_table_name}`);
          rowCount = countRes ? countRes.count : 0;
        } catch {
          rowCount = 0;
        }
        return {
          ...t,
          rowCount
        };
      });
      return {
        ...d,
        tables: tablesWithCount
      };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/databases', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Nama database hanya boleh alphanumeric dan underscore'),
      description: z.string().optional()
    });
    const parsed = schema.parse(req.body);
    const db = await getDb();

    const existing = queryOne(db, `SELECT id FROM _rms_databases WHERE name = ?`, [parsed.name.toUpperCase()]);
    if (existing) {
      return res.status(400).json({ error: `Database dengan nama '${parsed.name.toUpperCase()}' sudah ada.` });
    }

    const id = 'db-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();
    executeSql(
      db,
      `INSERT INTO _rms_databases (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [id, parsed.name.toUpperCase(), parsed.description || '', now, now]
    );

    addAuditLog(db, 'CREATE_DATABASE', 'DATABASE', id, `Database baru '${parsed.name.toUpperCase()}' dibuat.`);
    res.status(201).json({ id, name: parsed.name.toUpperCase(), description: parsed.description });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/databases/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const db = await getDb();

    const existing = queryOne(db, `SELECT * FROM _rms_databases WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Database tidak ditemukan.' });
    }

    const cleanName = name ? name.toUpperCase().replace(/[^A-Z0-9_]/g, '') : existing.name;
    const now = new Date().toISOString();

    executeSql(
      db,
      `UPDATE _rms_databases SET name = ?, description = ?, updated_at = ? WHERE id = ?`,
      [cleanName, description !== undefined ? description : existing.description, now, id]
    );

    addAuditLog(db, 'UPDATE_DATABASE', 'DATABASE', id, `Database '${existing.name}' diperbarui menjadi '${cleanName}'.`);
    res.json({ success: true, name: cleanName });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/databases/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const existing = queryOne(db, `SELECT * FROM _rms_databases WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Database tidak ditemukan.' });
    }

    // Drop physical tables
    const tables = queryAll(db, `SELECT * FROM _rms_tables WHERE database_id = ?`, [id]);
    for (const t of tables) {
      try {
        db.run(`DROP TABLE IF EXISTS ${t.physical_table_name};`);
      } catch {}
      executeSql(db, `DELETE FROM _rms_columns WHERE table_id = ?`, [t.id]);
    }

    executeSql(db, `DELETE FROM _rms_tables WHERE database_id = ?`, [id]);
    executeSql(db, `DELETE FROM _rms_databases WHERE id = ?`, [id]);

    addAuditLog(db, 'DELETE_DATABASE', 'DATABASE', id, `Database '${existing.name}' beserta seluruh tabel fisiknya dihapus.`);
    res.json({ success: true, message: `Database '${existing.name}' berhasil dihapus.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. TABLE DESIGNER & TABLES
// ==========================================
apiRouter.get('/databases/:dbName/tables', async (req: Request, res: Response) => {
  try {
    const { dbName } = req.params;
    const db = await getDb();
    const tables = queryAll(db, `SELECT * FROM _rms_tables WHERE database_name = ? ORDER BY table_name ASC`, [dbName.toUpperCase()]);

    const result = tables.map(t => {
      const columns = queryAll(db, `SELECT * FROM _rms_columns WHERE table_id = ? ORDER BY ordinal_position ASC`, [t.id]);
      let rowCount = 0;
      try {
        const countRes = queryOne<{ count: number }>(db, `SELECT COUNT(*) as count FROM ${t.physical_table_name}`);
        rowCount = countRes ? countRes.count : 0;
      } catch {
        rowCount = 0;
      }
      return {
        ...t,
        columns,
        rowCount
      };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/tables/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const table = queryOne(db, `SELECT * FROM _rms_tables WHERE id = ?`, [id]);
    if (!table) {
      return res.status(404).json({ error: 'Tabel tidak ditemukan.' });
    }

    const columns = queryAll(db, `SELECT * FROM _rms_columns WHERE table_id = ? ORDER BY ordinal_position ASC`, [table.id]);
    let rowCount = 0;
    try {
      const countRes = queryOne<{ count: number }>(db, `SELECT COUNT(*) as count FROM ${table.physical_table_name}`);
      rowCount = countRes ? countRes.count : 0;
    } catch {}

    res.json({
      ...table,
      columns,
      rowCount
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Preview SQL DDL without creating
apiRouter.post('/tables/preview-sql', (req: Request, res: Response) => {
  try {
    const { databaseName, tableName, columns } = req.body;
    if (!databaseName || !tableName || !columns || !Array.isArray(columns) || columns.length === 0) {
      return res.status(400).json({ error: 'Database name, table name, dan columns wajib diisi.' });
    }

    const physicalName = generatePhysicalTableName(databaseName, tableName);
    const ddl = generateSqlDdl(physicalName, columns);
    res.json({ physicalTableName: physicalName, sql: ddl });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

function generateSqlDdl(physicalName: string, columns: any[]): string {
  const colDefs: string[] = [];
  const primaryKeys: string[] = [];

  for (const c of columns) {
    const name = c.columnName.replace(/[^a-zA-Z0-9_]/g, '');
    let type = 'TEXT';
    const rawType = String(c.dataType).toUpperCase();

    if (rawType === 'INTEGER' || rawType === 'BIGINT') type = 'INTEGER';
    else if (rawType === 'DECIMAL' || rawType === 'NUMERIC') type = 'REAL';
    else if (rawType === 'BOOLEAN') type = 'INTEGER';
    else if (rawType === 'DATE' || rawType === 'TIMESTAMP' || rawType === 'VARCHAR' || rawType === 'UUID' || rawType === 'TEXT') type = 'TEXT';

    let def = `  "${name}" ${type}`;
    if (!c.isNullable && !c.isPrimaryKey) def += ' NOT NULL';
    if (c.isUnique) def += ' UNIQUE';
    if (c.defaultValue) def += ` DEFAULT '${c.defaultValue}'`;
    if (c.isPrimaryKey) primaryKeys.push(`"${name}"`);

    colDefs.push(def);
  }

  if (primaryKeys.length > 0) {
    colDefs.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
  }

  return `CREATE TABLE "${physicalName}" (\n${colDefs.join(',\n')}\n);`;
}

// Create new Table dynamically
apiRouter.post('/databases/:dbName/tables', async (req: Request, res: Response) => {
  try {
    const { dbName } = req.params;
    const bodySchema = z.object({
      tableName: z.string().min(2).max(50).regex(/^[a-zA-Z0-9_]+$/),
      description: z.string().optional(),
      columns: z.array(z.object({
        columnName: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/),
        dataType: z.enum(['VARCHAR', 'TEXT', 'INTEGER', 'BIGINT', 'DECIMAL', 'BOOLEAN', 'DATE', 'TIMESTAMP', 'UUID']),
        maxLength: z.number().optional().nullable(),
        isNullable: z.boolean().default(true),
        isPrimaryKey: z.boolean().default(false),
        isUnique: z.boolean().default(false),
        defaultValue: z.string().optional().nullable()
      })).min(1)
    });

    const parsed = bodySchema.parse(req.body);
    const db = await getDb();

    // Verify database exists
    const dbRecord = queryOne(db, `SELECT * FROM _rms_databases WHERE name = ?`, [dbName.toUpperCase()]);
    if (!dbRecord) {
      return res.status(404).json({ error: `Database '${dbName}' tidak ditemukan.` });
    }

    const cleanTableName = parsed.tableName.toLowerCase();
    const existingTable = queryOne(db, `SELECT id FROM _rms_tables WHERE database_name = ? AND table_name = ?`, [dbName.toUpperCase(), cleanTableName]);
    if (existingTable) {
      return res.status(400).json({ error: `Tabel '${cleanTableName}' sudah ada pada database '${dbName}'.` });
    }

    const physicalName = generatePhysicalTableName(dbName, cleanTableName);
    const ddl = generateSqlDdl(physicalName, parsed.columns);

    // Execute real DDL on SQLite
    db.run(ddl);

    // Catalog table and columns
    const tableId = 'tbl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    executeSql(
      db,
      `INSERT INTO _rms_tables (id, database_id, database_name, table_name, physical_table_name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tableId, dbRecord.id, dbName.toUpperCase(), cleanTableName, physicalName, parsed.description || '', now, now]
    );

    parsed.columns.forEach((col, idx) => {
      const colId = 'col-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substring(2, 6);
      executeSql(
        db,
        `INSERT INTO _rms_columns (id, table_id, column_name, data_type, max_length, is_nullable, is_primary_key, is_unique, default_value, ordinal_position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [colId, tableId, col.columnName.toLowerCase(), col.dataType, col.maxLength || null, col.isNullable ? 1 : 0, col.isPrimaryKey ? 1 : 0, col.isUnique ? 1 : 0, col.defaultValue || null, idx + 1]
      );
    });

    addAuditLog(db, 'CREATE_TABLE', 'TABLE', tableId, `Tabel '${cleanTableName}' berhasil dibuat pada database '${dbName.toUpperCase()}'.`);

    res.status(201).json({
      id: tableId,
      databaseName: dbName.toUpperCase(),
      tableName: cleanTableName,
      physicalTableName: physicalName,
      columnsCount: parsed.columns.length
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/tables/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const table = queryOne(db, `SELECT * FROM _rms_tables WHERE id = ?`, [id]);
    if (!table) {
      return res.status(404).json({ error: 'Tabel tidak ditemukan.' });
    }

    // Drop physical table
    try {
      db.run(`DROP TABLE IF EXISTS ${table.physical_table_name};`);
    } catch (e) {
      console.warn('Error dropping physical table:', e);
    }

    executeSql(db, `DELETE FROM _rms_columns WHERE table_id = ?`, [id]);
    executeSql(db, `DELETE FROM _rms_tables WHERE id = ?`, [id]);

    addAuditLog(db, 'DELETE_TABLE', 'TABLE', id, `Tabel '${table.table_name}' (${table.database_name}) dihapus.`);
    res.json({ success: true, message: `Tabel '${table.table_name}' berhasil dihapus.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. DATA EXPLORER & RECORDS CRUD
// ==========================================
apiRouter.get('/tables/:tableId/records', async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const search = (req.query.search as string || '').trim();
    const sortBy = (req.query.sortBy as string || '').trim();
    const sortDir = (req.query.sortDir as string || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const db = await getDb();
    const table = queryOne(db, `SELECT * FROM _rms_tables WHERE id = ?`, [tableId]);
    if (!table) {
      return res.status(404).json({ error: 'Tabel tidak ditemukan.' });
    }

    const columns = queryAll(db, `SELECT * FROM _rms_columns WHERE table_id = ? ORDER BY ordinal_position ASC`, [tableId]);
    const validColNames = columns.map(c => c.column_name);

    let whereClause = '';
    const params: any[] = [];

    if (search && validColNames.length > 0) {
      const searchLikes = validColNames.map(col => `CAST("${col}" AS TEXT) LIKE ?`);
      whereClause = `WHERE (${searchLikes.join(' OR ')})`;
      for (let i = 0; i < validColNames.length; i++) {
        params.push(`%${search}%`);
      }
    }

    let orderClause = '';
    if (sortBy && validColNames.includes(sortBy.toLowerCase())) {
      orderClause = `ORDER BY "${sortBy.toLowerCase()}" ${sortDir}`;
    }

    const countSql = `SELECT COUNT(*) as count FROM ${table.physical_table_name} ${whereClause}`;
    const countRes = queryOne<{ count: number }>(db, countSql, params);
    const total = countRes ? countRes.count : 0;

    const dataSql = `SELECT * FROM ${table.physical_table_name} ${whereClause} ${orderClause} LIMIT ? OFFSET ?`;
    const rows = queryAll(db, dataSql, [...params, limit, offset]);

    res.json({
      records: rows,
      columns,
      table,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/tables/:tableId/records', async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params;
    const record = req.body;
    const db = await getDb();

    const table = queryOne(db, `SELECT * FROM _rms_tables WHERE id = ?`, [tableId]);
    if (!table) {
      return res.status(404).json({ error: 'Tabel tidak ditemukan.' });
    }

    const columns = queryAll(db, `SELECT * FROM _rms_columns WHERE table_id = ?`, [tableId]);
    if (columns.length === 0) {
      return res.status(400).json({ error: 'Tabel tidak memiliki kolom yang didefinisikan.' });
    }

    // Auto-generate id if primary key is missing
    const pkCol = columns.find(c => c.is_primary_key === 1);
    if (pkCol && !record[pkCol.column_name]) {
      record[pkCol.column_name] = 'REC-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    }

    const colsToInsert: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];

    for (const c of columns) {
      if (record[c.column_name] !== undefined) {
        colsToInsert.push(`"${c.column_name}"`);
        placeholders.push('?');
        values.push(record[c.column_name]);
      }
    }

    if (colsToInsert.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data kolom yang valid untuk disimpan.' });
    }

    const sql = `INSERT INTO ${table.physical_table_name} (${colsToInsert.join(', ')}) VALUES (${placeholders.join(', ')})`;
    executeSql(db, sql, values);

    addAuditLog(db, 'INSERT_RECORD', 'TABLE_RECORD', tableId, `Menambahkan 1 baris ke tabel ${table.table_name}`);
    res.status(201).json({ success: true, record });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/tables/:tableId/records/:recordId', async (req: Request, res: Response) => {
  try {
    const { tableId, recordId } = req.params;
    const updates = req.body;
    const db = await getDb();

    const table = queryOne(db, `SELECT * FROM _rms_tables WHERE id = ?`, [tableId]);
    if (!table) return res.status(404).json({ error: 'Tabel tidak ditemukan.' });

    const columns = queryAll(db, `SELECT * FROM _rms_columns WHERE table_id = ?`, [tableId]);
    const pkCol = columns.find(c => c.is_primary_key === 1) || columns[0];

    const setClauses: string[] = [];
    const values: any[] = [];

    for (const c of columns) {
      if (updates[c.column_name] !== undefined && c.column_name !== pkCol.column_name) {
        setClauses.push(`"${c.column_name}" = ?`);
        values.push(updates[c.column_name]);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Tidak ada kolom yang diubah.' });
    }

    values.push(recordId);
    const sql = `UPDATE ${table.physical_table_name} SET ${setClauses.join(', ')} WHERE "${pkCol.column_name}" = ?`;
    executeSql(db, sql, values);

    addAuditLog(db, 'UPDATE_RECORD', 'TABLE_RECORD', tableId, `Memperbarui record ID ${recordId} pada tabel ${table.table_name}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/tables/:tableId/records/:recordId', async (req: Request, res: Response) => {
  try {
    const { tableId, recordId } = req.params;
    const db = await getDb();

    const table = queryOne(db, `SELECT * FROM _rms_tables WHERE id = ?`, [tableId]);
    if (!table) return res.status(404).json({ error: 'Tabel tidak ditemukan.' });

    const columns = queryAll(db, `SELECT * FROM _rms_columns WHERE table_id = ?`, [tableId]);
    const pkCol = columns.find(c => c.is_primary_key === 1) || columns[0];

    const sql = `DELETE FROM ${table.physical_table_name} WHERE "${pkCol.column_name}" = ?`;
    executeSql(db, sql, [recordId]);

    addAuditLog(db, 'DELETE_RECORD', 'TABLE_RECORD', tableId, `Menghapus record ID ${recordId} dari tabel ${table.table_name}`);
    res.json({ success: true, message: 'Record berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Generate Random Sample Records
apiRouter.post('/tables/:tableId/generate-sample', async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params;
    const count = Math.min(50, Math.max(1, parseInt(req.body.count) || 5));
    const db = await getDb();

    const table = queryOne(db, `SELECT * FROM _rms_tables WHERE id = ?`, [tableId]);
    if (!table) return res.status(404).json({ error: 'Tabel tidak ditemukan.' });

    const columns = queryAll(db, `SELECT * FROM _rms_columns WHERE table_id = ?`, [tableId]);
    const channels = ['ATM', 'MOBILE_BANKING', 'INTERNET_BANKING', 'QRIS', 'EDC', 'VA_TRANSFER'];
    const statuses = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'PENDING', 'FAILED'];

    for (let i = 0; i < count; i++) {
      const row: any = {};
      const refNum = 'TRX-' + (20261002 + Math.floor(Math.random() * 5)) + '-' + String(Math.floor(Math.random() * 900) + 100);
      const amount = (Math.floor(Math.random() * 200) + 1) * 25000;
      const date = '2026-10-0' + (Math.floor(Math.random() * 7) + 1);

      for (const col of columns) {
        const name = col.column_name.toLowerCase();
        if (col.is_primary_key) {
          row[name] = 'GEN-' + Date.now().toString(36) + '-' + i;
        } else if (name.includes('ref')) {
          row[name] = refNum;
        } else if (name.includes('amount')) {
          row[name] = amount;
        } else if (name.includes('date')) {
          row[name] = date;
        } else if (name.includes('status')) {
          row[name] = statuses[Math.floor(Math.random() * statuses.length)];
        } else if (name.includes('channel')) {
          row[name] = channels[Math.floor(Math.random() * channels.length)];
        } else if (name.includes('curr')) {
          row[name] = 'IDR';
        } else {
          row[name] = `Val-${i + 1}`;
        }
      }

      const colNames = Object.keys(row).map(c => `"${c}"`).join(', ');
      const placeholders = Object.keys(row).map(() => '?').join(', ');
      const values = Object.values(row);

      executeSql(db, `INSERT INTO ${table.physical_table_name} (${colNames}) VALUES (${placeholders})`, values);
    }

    addAuditLog(db, 'GENERATE_SAMPLE_DATA', 'TABLE', tableId, `Membuat ${count} data sampel transaksi untuk tabel ${table.table_name}`);
    res.json({ success: true, count, message: `${count} transaksi sampel berhasil dibuat.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Import CSV Records
apiRouter.post('/tables/:tableId/import-csv', async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params;
    const { csvContent } = req.body;
    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({ error: 'Konten CSV wajib disertakan.' });
    }

    const db = await getDb();
    const table = queryOne(db, `SELECT * FROM _rms_tables WHERE id = ?`, [tableId]);
    if (!table) return res.status(404).json({ error: 'Tabel tidak ditemukan.' });

    const columns = queryAll(db, `SELECT * FROM _rms_columns WHERE table_id = ?`, [tableId]);
    const validColNames = new Set(columns.map(c => c.column_name.toLowerCase()));

    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV harus memiliki baris header dan minimal 1 baris data.' });
    }

    const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const validIndices: { col: string; idx: number }[] = [];

    header.forEach((h, idx) => {
      if (validColNames.has(h)) {
        validIndices.push({ col: h, idx });
      }
    });

    if (validIndices.length === 0) {
      return res.status(400).json({ error: 'Tidak ada kolom CSV yang cocok dengan skema tabel.' });
    }

    let inserted = 0;
    for (let i = 1; i < lines.length; i++) {
      const lineValues = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const colNamesToInsert: string[] = [];
      const placeholders: string[] = [];
      const values: any[] = [];

      for (const vi of validIndices) {
        colNamesToInsert.push(`"${vi.col}"`);
        placeholders.push('?');
        values.push(lineValues[vi.idx] || null);
      }

      // Check if PK needed
      const pkCol = columns.find(c => c.is_primary_key === 1);
      if (pkCol && !colNamesToInsert.includes(`"${pkCol.column_name}"`)) {
        colNamesToInsert.push(`"${pkCol.column_name}"`);
        placeholders.push('?');
        values.push('CSV-' + Date.now() + '-' + i);
      }

      try {
        executeSql(db, `INSERT INTO ${table.physical_table_name} (${colNamesToInsert.join(', ')}) VALUES (${placeholders.join(', ')})`, values);
        inserted++;
      } catch (insertErr) {
        console.warn('Skipping CSV row error:', insertErr);
      }
    }

    addAuditLog(db, 'IMPORT_CSV', 'TABLE', tableId, `Mengimpor ${inserted} baris data dari CSV ke tabel ${table.table_name}`);
    res.json({ success: true, insertedCount: inserted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Run Read-Only SELECT Query
apiRouter.post('/query/execute', async (req: Request, res: Response) => {
  try {
    const { sql } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'Query SQL wajib diisi.' });
    }

    const trimmed = sql.trim();
    if (!trimmed.toUpperCase().startsWith('SELECT') && !trimmed.toUpperCase().startsWith('PRAGMA') && !trimmed.toUpperCase().startsWith('EXPLAIN')) {
      return res.status(403).json({ error: 'Hanya query read-only (SELECT, PRAGMA) yang diizinkan melalui Query Runner.' });
    }

    const db = await getDb();
    const rows = queryAll(db, trimmed);
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    res.json({
      success: true,
      rowCount: rows.length,
      columns,
      rows: rows.slice(0, 100)
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 5. RECONCILIATION MODULES
// ==========================================
apiRouter.get('/modules', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const modules = queryAll(db, `SELECT * FROM _rms_modules ORDER BY created_at DESC`);
    const parsed = modules.map(m => {
      let cfg = {};
      try { cfg = JSON.parse(m.matching_config); } catch {}
      return {
        ...m,
        matching_config: cfg
      };
    });
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/modules', async (req: Request, res: Response) => {
  try {
    const bodySchema = z.object({
      moduleName: z.string().min(3).max(60),
      description: z.string().optional(),
      moduleType: z.string().default('Reconciliation / Matching'),
      sourceDatabase: z.string(),
      sourceTable: z.string(),
      targetDatabase: z.string(),
      targetTable: z.string(),
      matchingConfig: z.object({
        matchingFields: z.array(z.object({
          sourceField: z.string(),
          targetField: z.string()
        })).min(1),
        comparisonFields: z.array(z.object({
          sourceField: z.string(),
          targetField: z.string(),
          comparisonType: z.enum(['EXACT', 'AMOUNT', 'DATE', 'STATUS']),
          tolerance: z.number().optional(),
          toleranceDays: z.number().optional()
        })),
        nullHandling: z.string().optional(),
        duplicatePolicy: z.string().optional()
      }),
      status: z.enum(['Draft', 'Active', 'Inactive']).default('Active')
    });

    const parsed = bodySchema.parse(req.body);
    const db = await getDb();

    const existing = queryOne(db, `SELECT id FROM _rms_modules WHERE module_name = ?`, [parsed.moduleName]);
    if (existing) {
      return res.status(400).json({ error: `Modul dengan nama '${parsed.moduleName}' sudah ada.` });
    }

    const id = 'mod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    executeSql(
      db,
      `INSERT INTO _rms_modules (id, module_name, description, module_type, source_database, source_table, target_database, target_table, matching_config, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        parsed.moduleName,
        parsed.description || '',
        parsed.moduleType,
        parsed.sourceDatabase,
        parsed.sourceTable,
        parsed.targetDatabase,
        parsed.targetTable,
        JSON.stringify(parsed.matchingConfig),
        parsed.status,
        now,
        now
      ]
    );

    addAuditLog(db, 'CREATE_MODULE', 'MODULE', id, `Modul rekonsiliasi '${parsed.moduleName}' dibuat.`);
    res.status(201).json({ id, ...parsed });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Template-Based Module Creation (Auto-provision source & target tables, matching rules, job, and sample data)
apiRouter.post('/modules/provision-from-template', async (req: Request, res: Response) => {
  try {
    const { moduleName, templateType = 'ORDER_TO_PAYMENT', generateSampleData = true } = req.body;
    if (!moduleName || typeof moduleName !== 'string' || moduleName.trim().length < 2) {
      return res.status(400).json({ error: 'Nama modul wajib diisi (minimal 2 karakter).' });
    }

    const cleanInput = moduleName.trim();
    const rawSlug = cleanInput.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const moduleCode = rawSlug.endsWith('_RECON') ? rawSlug : `${rawSlug}_RECON`;
    const jobName = `JOB_${moduleCode}`;
    const cleanPrefix = rawSlug.toLowerCase();
    const now = new Date().toISOString();

    const db = await getDb();

    // Check if module code already exists
    const existingMod = queryOne(db, `SELECT id FROM _rms_modules WHERE module_name = ?`, [moduleCode]);
    if (existingMod) {
      return res.status(400).json({ error: `Modul dengan kode '${moduleCode}' sudah ada dalam katalog.` });
    }

    const opsDb = 'DEMO_OPERATIONS_DB';
    const recsDb = 'DEMO_RECORDS_DB';
    const sourceTable = `${cleanPrefix}_source`;
    const targetTable = `${cleanPrefix}_target`;

    const sourcePhys = generatePhysicalTableName(opsDb, sourceTable);
    const targetPhys = generatePhysicalTableName(recsDb, targetTable);

    let sourceCols: any[] = [];
    let targetCols: any[] = [];
    let matchingConfig: any = {};
    let moduleTypeName = 'Order-to-Payment Reconciliation';

    if (templateType === 'INVENTORY_RECON') {
      moduleTypeName = 'Inventory Reconciliation';
      sourceCols = [
        { name: 'id', type: 'UUID', isPk: 1 },
        { name: 'product_code', type: 'VARCHAR', maxLen: 50, isNull: 0 },
        { name: 'warehouse_id', type: 'VARCHAR', maxLen: 50, isNull: 0 },
        { name: 'movement_date', type: 'DATE', isNull: 0 },
        { name: 'expected_quantity', type: 'DECIMAL', isNull: 0 },
        { name: 'movement_type', type: 'VARCHAR', maxLen: 20, isNull: 0 }
      ];
      targetCols = [
        { name: 'id', type: 'UUID', isPk: 1 },
        { name: 'product_code', type: 'VARCHAR', maxLen: 50, isNull: 0 },
        { name: 'warehouse_id', type: 'VARCHAR', maxLen: 50, isNull: 0 },
        { name: 'audit_date', type: 'DATE', isNull: 0 },
        { name: 'recorded_quantity', type: 'DECIMAL', isNull: 0 },
        { name: 'auditor_name', type: 'VARCHAR', maxLen: 100, isNull: 0 }
      ];
      matchingConfig = {
        matchingFields: [{ sourceField: 'product_code', targetField: 'product_code' }],
        comparisonFields: [
          { sourceField: 'expected_quantity', targetField: 'recorded_quantity', comparisonType: 'AMOUNT', tolerance: 0.00 },
          { sourceField: 'movement_date', targetField: 'audit_date', comparisonType: 'DATE', toleranceDays: 0 }
        ],
        filters: { sourceFilter: '', targetFilter: '' },
        nullHandling: 'FAIL_ON_NULL',
        duplicatePolicy: 'FLAG_AMBIGUOUS'
      };
    } else if (templateType === 'TWO_SOURCE_TRANSACTION') {
      moduleTypeName = 'Two-Source Transaction Reconciliation';
      sourceCols = [
        { name: 'id', type: 'UUID', isPk: 1 },
        { name: 'transaction_ref', type: 'VARCHAR', maxLen: 50, isNull: 0 },
        { name: 'trx_date', type: 'DATE', isNull: 0 },
        { name: 'amount', type: 'DECIMAL', isNull: 0 },
        { name: 'channel', type: 'VARCHAR', maxLen: 50, isNull: 0 },
        { name: 'status', type: 'VARCHAR', maxLen: 20, isNull: 0 }
      ];
      targetCols = [
        { name: 'id', type: 'UUID', isPk: 1 },
        { name: 'transaction_ref', type: 'VARCHAR', maxLen: 50, isNull: 0 },
        { name: 'trx_date', type: 'DATE', isNull: 0 },
        { name: 'amount', type: 'DECIMAL', isNull: 0 },
        { name: 'partner_ref', type: 'VARCHAR', maxLen: 50, isNull: 0 },
        { name: 'status', type: 'VARCHAR', maxLen: 20, isNull: 0 }
      ];
      matchingConfig = {
        matchingFields: [{ sourceField: 'transaction_ref', targetField: 'transaction_ref' }],
        comparisonFields: [
          { sourceField: 'amount', targetField: 'amount', comparisonType: 'AMOUNT', tolerance: 0.00 },
          { sourceField: 'trx_date', targetField: 'trx_date', comparisonType: 'DATE', toleranceDays: 0 },
          { sourceField: 'status', targetField: 'status', comparisonType: 'STATUS' }
        ],
        filters: { sourceFilter: '', targetFilter: '' },
        nullHandling: 'FAIL_ON_NULL',
        duplicatePolicy: 'FLAG_AMBIGUOUS'
      };
    } else {
      moduleTypeName = templateType === 'THREE_SOURCE_RECON' ? 'Three-Source Reconciliation' : 'Order-to-Payment Reconciliation';
      sourceCols = [
        { name: 'id', type: 'UUID', isPk: 1 },
        { name: 'order_id', type: 'VARCHAR', maxLen: 50, isNull: 0 },
        { name: 'order_date', type: 'DATE', isNull: 0 },
        { name: 'order_amount', type: 'DECIMAL', isNull: 0 },
        { name: 'customer_name', type: 'VARCHAR', maxLen: 100, isNull: 0 },
        { name: 'status', type: 'VARCHAR', maxLen: 20, isNull: 0 }
      ];
      targetCols = [
        { name: 'id', type: 'UUID', isPk: 1 },
        { name: 'order_id', type: 'VARCHAR', maxLen: 50, isNull: 0 },
        { name: 'payment_date', type: 'DATE', isNull: 0 },
        { name: 'paid_amount', type: 'DECIMAL', isNull: 0 },
        { name: 'payment_method', type: 'VARCHAR', maxLen: 50, isNull: 0 },
        { name: 'status', type: 'VARCHAR', maxLen: 20, isNull: 0 }
      ];
      matchingConfig = {
        matchingFields: [{ sourceField: 'order_id', targetField: 'order_id' }],
        comparisonFields: [
          { sourceField: 'order_amount', targetField: 'paid_amount', comparisonType: 'AMOUNT', tolerance: 0.00 },
          { sourceField: 'order_date', targetField: 'payment_date', comparisonType: 'DATE', toleranceDays: 0 },
          { sourceField: 'status', targetField: 'status', comparisonType: 'STATUS' }
        ],
        filters: { sourceFilter: '', targetFilter: '' },
        nullHandling: 'FAIL_ON_NULL',
        duplicatePolicy: 'FLAG_AMBIGUOUS'
      };
    }

    const createTableDdl = (physName: string, cols: any[]) => {
      const defs = cols.map(c => `"${c.name}" ${c.type === 'DECIMAL' ? 'REAL' : c.type === 'INTEGER' ? 'INTEGER' : 'TEXT'} ${c.isPk ? 'PRIMARY KEY' : ''}`);
      return `CREATE TABLE IF NOT EXISTS "${physName}" (${defs.join(', ')});`;
    };

    db.run(createTableDdl(sourcePhys, sourceCols));
    db.run(createTableDdl(targetPhys, targetCols));

    const srcTblId = 'tbl-' + Date.now() + '-src';
    const tgtTblId = 'tbl-' + Date.now() + '-tgt';

    const dbOpsRow = queryOne(db, `SELECT id FROM _rms_databases WHERE name = ?`, [opsDb]);
    const dbRecsRow = queryOne(db, `SELECT id FROM _rms_databases WHERE name = ?`, [recsDb]);

    executeSql(db, `INSERT INTO _rms_tables (id, database_id, database_name, table_name, physical_table_name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [srcTblId, dbOpsRow?.id || 'db-ops', opsDb, sourceTable, sourcePhys, `Tabel sumber otomatis untuk modul ${cleanInput}`, now, now]);
    executeSql(db, `INSERT INTO _rms_tables (id, database_id, database_name, table_name, physical_table_name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tgtTblId, dbRecsRow?.id || 'db-recs', recsDb, targetTable, targetPhys, `Tabel target otomatis untuk modul ${cleanInput}`, now, now]);

    sourceCols.forEach((col, idx) => {
      executeSql(db, `INSERT INTO _rms_columns (id, table_id, column_name, data_type, max_length, is_nullable, is_primary_key, is_unique, default_value, ordinal_position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [`col-${srcTblId}-${col.name}`, srcTblId, col.name, col.type, col.maxLen || null, col.isPk ? 0 : 1, col.isPk ? 1 : 0, col.isPk ? 1 : 0, null, idx + 1]);
    });

    targetCols.forEach((col, idx) => {
      executeSql(db, `INSERT INTO _rms_columns (id, table_id, column_name, data_type, max_length, is_nullable, is_primary_key, is_unique, default_value, ordinal_position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [`col-${tgtTblId}-${col.name}`, tgtTblId, col.name, col.type, col.maxLen || null, col.isPk ? 0 : 1, col.isPk ? 1 : 0, col.isPk ? 1 : 0, null, idx + 1]);
    });

    if (generateSampleData) {
      const sampleCount = 8;
      for (let i = 1; i <= sampleCount; i++) {
        if (templateType === 'INVENTORY_RECON') {
          const sku = `SKU-${rawSlug.slice(0, 4)}-${String(i).padStart(3, '0')}`;
          const qty = 20 + i * 5;
          executeSql(db, `INSERT INTO "${sourcePhys}" VALUES (?, ?, ?, ?, ?, ?)`,
            [`SRC-${i}`, sku, 'WH-01', '2026-10-01', qty, 'INBOUND']);
          const recQty = i === 4 ? qty - 2 : qty;
          executeSql(db, `INSERT INTO "${targetPhys}" VALUES (?, ?, ?, ?, ?, ?)`,
            [`TGT-${i}`, sku, 'WH-01', '2026-10-01', recQty, 'Audit Staff']);
        } else {
          const ref = `${rawSlug.slice(0, 4)}-${String(100 + i)}`;
          const amt = 50000 + i * 15000;
          executeSql(db, `INSERT INTO "${sourcePhys}" VALUES (?, ?, ?, ?, ?, ?)`,
            [`SRC-${i}`, ref, '2026-10-01', amt, `Pelanggan ${i}`, i === 6 ? 'PENDING' : 'COMPLETED']);
          const targetAmt = i === 3 ? amt - 5000 : amt;
          if (i !== 7) {
            executeSql(db, `INSERT INTO "${targetPhys}" VALUES (?, ?, ?, ?, ?, ?)`,
              [`TGT-${i}`, ref, '2026-10-01', targetAmt, 'QRIS_PAY', i === 6 ? 'PENDING' : 'COMPLETED']);
          }
        }
      }
    }

    const modId = 'mod-' + Date.now();
    executeSql(db, `INSERT INTO _rms_modules (id, module_name, description, module_type, source_database, source_table, target_database, target_table, matching_config, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        modId,
        moduleCode,
        `Modul rekonsiliasi otomatis template untuk ${cleanInput}`,
        moduleTypeName,
        opsDb,
        sourceTable,
        recsDb,
        targetTable,
        JSON.stringify(matchingConfig),
        'Active',
        now,
        now
      ]);

    const jobId = 'job-' + Date.now();
    executeSql(db, `INSERT INTO _rms_jobs (id, job_name, description, module_ids, execution_order, dependencies, retry_limit, timeout_seconds, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        jobId,
        jobName,
        `Job orkestrasi harian untuk modul ${moduleCode}`,
        JSON.stringify([modId]),
        JSON.stringify([modId]),
        JSON.stringify({}),
        3,
        300,
        1,
        now,
        now
      ]);

    addAuditLog(db, 'PROVISION_TEMPLATE', 'MODULE', modId, `Modul '${moduleCode}' dan Job '${jobName}' berhasil dibuat dari template ${templateType}.`);

    res.status(201).json({
      success: true,
      message: `Modul '${moduleCode}' dan Job '${jobName}' berhasil dibuat.`,
      module: {
        id: modId,
        module_name: moduleCode,
        source_database: opsDb,
        source_table: sourceTable,
        target_database: recsDb,
        target_table: targetTable,
        module_type: moduleTypeName
      },
      job: {
        id: jobId,
        job_name: jobName
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/modules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const mod = queryOne(db, `SELECT * FROM _rms_modules WHERE id = ?`, [id]);
    if (!mod) return res.status(404).json({ error: 'Modul tidak ditemukan.' });

    executeSql(db, `DELETE FROM _rms_modules WHERE id = ?`, [id]);
    addAuditLog(db, 'DELETE_MODULE', 'MODULE', id, `Modul rekonsiliasi '${mod.module_name}' dihapus.`);
    res.json({ success: true, message: `Modul '${mod.module_name}' berhasil dihapus.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Preview Matching
apiRouter.post('/modules/preview-matching', async (req: Request, res: Response) => {
  try {
    const { sourceDatabase, sourceTable, targetDatabase, targetTable, matchingFields, comparisonFields } = req.body;
    const db = await getDb();

    const sourcePhys = generatePhysicalTableName(sourceDatabase, sourceTable);
    const targetPhys = generatePhysicalTableName(targetDatabase, targetTable);

    const sourceRows = queryAll(db, `SELECT * FROM ${sourcePhys} LIMIT 10`);
    const targetRows = queryAll(db, `SELECT * FROM ${targetPhys} LIMIT 10`);

    res.json({
      sourceSampleCount: sourceRows.length,
      targetSampleCount: targetRows.length,
      sourceSample: sourceRows,
      targetSample: targetRows,
      simulatedRulePreview: {
        matchingKeyColumns: matchingFields,
        comparisonRules: comparisonFields
      }
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 6. MATCHING RULES
// ==========================================
apiRouter.get('/matching-rules', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const rules = queryAll(db, `SELECT * FROM _rms_matching_rules ORDER BY created_at DESC`);
    res.json(rules.map(r => ({ ...r, config: JSON.parse(r.config || '{}') })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/matching-rules', async (req: Request, res: Response) => {
  try {
    const { ruleName, ruleType, description, config } = req.body;
    const db = await getDb();
    const id = 'rule-' + Date.now();
    const now = new Date().toISOString();

    executeSql(
      db,
      `INSERT INTO _rms_matching_rules (id, rule_name, rule_type, description, config, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, ruleName, ruleType, description || '', JSON.stringify(config || {}), now]
    );

    addAuditLog(db, 'CREATE_RULE', 'MATCHING_RULE', id, `Aturan matching '${ruleName}' dibuat.`);
    res.status(201).json({ id, ruleName, ruleType });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 7. JOBS & ORCHESTRATION
// ==========================================
apiRouter.get('/jobs', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const jobs = queryAll(db, `SELECT * FROM _rms_jobs ORDER BY created_at DESC`);
    const parsed = jobs.map(j => {
      const lastExec = queryOne(db, `SELECT * FROM _rms_job_executions WHERE job_id = ? ORDER BY start_time DESC LIMIT 1`, [j.id]);
      return {
        ...j,
        module_ids: JSON.parse(j.module_ids || '[]'),
        execution_order: JSON.parse(j.execution_order || '[]'),
        dependencies: JSON.parse(j.dependencies || '{}'),
        lastExecution: lastExec || null
      };
    });
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/jobs', async (req: Request, res: Response) => {
  try {
    const { jobName, description, moduleIds, executionOrder, dependencies, retryLimit, timeoutSeconds } = req.body;
    const db = await getDb();

    const existing = queryOne(db, `SELECT id FROM _rms_jobs WHERE job_name = ?`, [jobName]);
    if (existing) {
      return res.status(400).json({ error: `Job dengan nama '${jobName}' sudah ada.` });
    }

    const id = 'job-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    executeSql(
      db,
      `INSERT INTO _rms_jobs (id, job_name, description, module_ids, execution_order, dependencies, retry_limit, timeout_seconds, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        jobName,
        description || '',
        JSON.stringify(moduleIds || []),
        JSON.stringify(executionOrder || []),
        JSON.stringify(dependencies || {}),
        retryLimit || 3,
        timeoutSeconds || 300,
        1,
        now,
        now
      ]
    );

    addAuditLog(db, 'CREATE_JOB', 'JOB', id, `Job orkestrasi '${jobName}' dibuat.`);
    res.status(201).json({ id, jobName });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const job = queryOne(db, `SELECT * FROM _rms_jobs WHERE id = ?`, [id]);
    if (!job) return res.status(404).json({ error: 'Job tidak ditemukan.' });

    executeSql(db, `DELETE FROM _rms_jobs WHERE id = ?`, [id]);
    executeSql(db, `DELETE FROM _rms_job_schedules WHERE job_id = ?`, [id]);

    addAuditLog(db, 'DELETE_JOB', 'JOB', id, `Job '${job.job_name}' dihapus.`);
    res.json({ success: true, message: `Job '${job.job_name}' berhasil dihapus.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Run Job Immediately
apiRouter.post('/jobs/:id/run', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const result = await runJob(db, id);
    res.json({
      success: true,
      message: `Job '${result.jobName}' berhasil dijalankan dengan status: ${result.status}`,
      ...result
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Duplicate Job
apiRouter.post('/jobs/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const original = queryOne(db, `SELECT * FROM _rms_jobs WHERE id = ?`, [id]);
    if (!original) return res.status(404).json({ error: 'Job tidak ditemukan.' });

    const newId = 'job-' + Date.now();
    const newName = `${original.job_name}_COPY_${Math.floor(Math.random() * 900) + 100}`;
    const now = new Date().toISOString();

    executeSql(
      db,
      `INSERT INTO _rms_jobs (id, job_name, description, module_ids, execution_order, dependencies, retry_limit, timeout_seconds, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newId, newName, original.description, original.module_ids, original.execution_order, original.dependencies, original.retry_limit, original.timeout_seconds, 1, now, now]
    );

    addAuditLog(db, 'DUPLICATE_JOB', 'JOB', newId, `Menduplikasi job '${original.job_name}' menjadi '${newName}'`);
    res.json({ success: true, id: newId, jobName: newName });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. JOB SCHEDULER
// ==========================================
apiRouter.get('/schedules', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const schedules = queryAll(db, `
      SELECT s.*, j.job_name 
      FROM _rms_job_schedules s
      LEFT JOIN _rms_jobs j ON s.job_id = j.id
      ORDER BY s.created_at DESC
    `);
    res.json(schedules);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/schedules', async (req: Request, res: Response) => {
  try {
    const { jobId, scheduleName, cronExpression, timezone } = req.body;
    const db = await getDb();
    const id = 'sch-' + Date.now();
    const now = new Date().toISOString();
    const nextPlanned = new Date(Date.now() + 3600000).toISOString();

    executeSql(
      db,
      `INSERT INTO _rms_job_schedules (id, job_id, schedule_name, cron_expression, timezone, is_active, next_planned_execution, max_retries, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, jobId, scheduleName, cronExpression, timezone || 'Asia/Jakarta', 1, nextPlanned, 3, now]
    );

    addAuditLog(db, 'CREATE_SCHEDULE', 'SCHEDULE', id, `Jadwal '${scheduleName}' (${cronExpression}) dibuat.`);
    res.status(201).json({ id, scheduleName });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 9. EXECUTIONS & MONITORING
// ==========================================
apiRouter.get('/job-executions', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const executions = queryAll(db, `SELECT * FROM _rms_job_executions ORDER BY start_time DESC LIMIT 50`);
    const parsed = executions.map(e => ({
      ...e,
      summary: e.summary_json ? JSON.parse(e.summary_json) : null
    }));
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/job-executions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const execution = queryOne(db, `SELECT * FROM _rms_job_executions WHERE id = ?`, [id]);
    if (!execution) return res.status(404).json({ error: 'Eksekusi tidak ditemukan.' });

    const logs = queryAll(db, `SELECT * FROM _rms_execution_logs WHERE execution_id = ? ORDER BY timestamp ASC`, [id]);
    res.json({
      ...execution,
      summary: execution.summary_json ? JSON.parse(execution.summary_json) : null,
      logs
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/job-executions/:id/logs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const logs = queryAll(db, `SELECT * FROM _rms_execution_logs WHERE execution_id = ? ORDER BY timestamp ASC`, [id]);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. RECONCILIATION RESULTS
// ==========================================
apiRouter.get('/reconciliation-results', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const executionId = req.query.executionId as string;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    let targetExecId = executionId;
    if (!targetExecId) {
      // Pick the latest execution
      const latest = queryOne(db, `SELECT id FROM _rms_job_executions ORDER BY start_time DESC LIMIT 1`);
      if (latest) targetExecId = latest.id;
    }

    if (!targetExecId) {
      return res.json({ results: [], total: 0, execution: null });
    }

    const execution = queryOne(db, `SELECT * FROM _rms_job_executions WHERE id = ?`, [targetExecId]);

    const conditions: string[] = ['execution_id = ?'];
    const params: any[] = [targetExecId];

    if (status && status !== 'ALL') {
      conditions.push('reconciliation_status = ?');
      params.push(status);
    }

    if (search && search.trim().length > 0) {
      conditions.push('(matching_key LIKE ? OR reason LIKE ?)');
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    const whereSql = `WHERE ${conditions.join(' AND ')}`;

    const countRes = queryOne<{ count: number }>(db, `SELECT COUNT(*) as count FROM _rms_reconciliation_results ${whereSql}`, params);
    const total = countRes ? countRes.count : 0;

    const rows = queryAll(db, `SELECT * FROM _rms_reconciliation_results ${whereSql} ORDER BY created_at ASC LIMIT ? OFFSET ?`, [...params, limit, offset]);

    const parsedRows = rows.map(r => ({
      ...r,
      sourceData: r.source_data_json ? JSON.parse(r.source_data_json) : null,
      targetData: r.target_data_json ? JSON.parse(r.target_data_json) : null
    }));

    res.json({
      results: parsedRows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      execution: execution ? { ...execution, summary: execution.summary_json ? JSON.parse(execution.summary_json) : null } : null
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 11. REPORTS & EXPORT
// ==========================================
apiRouter.get('/reports/summary', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const executions = queryAll(db, `SELECT * FROM _rms_job_executions ORDER BY start_time DESC LIMIT 10`);
    const totalRuns = queryOne<{ count: number }>(db, `SELECT COUNT(*) as count FROM _rms_job_executions`)?.count || 0;
    const totalMatched = queryOne<{ sum: number }>(db, `SELECT SUM(matched_count) as sum FROM _rms_job_executions`)?.sum || 0;
    const totalUnmatched = queryOne<{ sum: number }>(db, `SELECT SUM(unmatched_count) as sum FROM _rms_job_executions`)?.sum || 0;

    res.json({
      totalRuns,
      totalMatched,
      totalUnmatched,
      overallMatchRate: (totalMatched + totalUnmatched) > 0 ? Number(((totalMatched / (totalMatched + totalUnmatched)) * 100).toFixed(2)) : 0,
      recentExecutions: executions.map(e => ({
        ...e,
        summary: e.summary_json ? JSON.parse(e.summary_json) : null
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Export CSV for an Execution
apiRouter.get('/reports/export/:executionId', async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;
    const filter = (req.query.type as string || 'ALL').toUpperCase();
    const db = await getDb();

    let sql = `SELECT * FROM _rms_reconciliation_results WHERE execution_id = ?`;
    const params: any[] = [executionId];

    if (filter === 'MATCHED') {
      sql += ` AND reconciliation_status = 'MATCHED'`;
    } else if (filter === 'UNMATCHED') {
      sql += ` AND reconciliation_status != 'MATCHED'`;
    }

    const rows = queryAll(db, sql, params);

    // Build CSV
    const headers = ['ID', 'Execution ID', 'Matching Key', 'Status', 'Source Amount', 'Target Amount', 'Difference', 'Reason', 'Created At'];
    const csvLines = [headers.join(',')];

    for (const r of rows) {
      const line = [
        `"${r.id}"`,
        `"${r.execution_id}"`,
        `"${r.matching_key || ''}"`,
        `"${r.reconciliation_status}"`,
        r.source_amount !== null ? r.source_amount : '',
        r.target_amount !== null ? r.target_amount : '',
        r.difference !== null ? r.difference : '',
        `"${(r.reason || '').replace(/"/g, '""')}"`,
        `"${r.created_at}"`
      ];
      csvLines.push(line.join(','));
    }

    const csvData = csvLines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="recon_report_${executionId}_${filter.toLowerCase()}.csv"`);
    res.send(csvData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 12. AUDIT LOGS
// ==========================================
apiRouter.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const logs = queryAll(db, `SELECT * FROM _rms_audit_logs ORDER BY timestamp DESC LIMIT ?`, [limit]);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 13. PRESENTATION DOWNLOAD & GENERATION
// ==========================================
apiRouter.get('/presentation/download', async (req: Request, res: Response) => {
  try {
    const { generatePresentationPptx } = await import('../services/presentationGenerator.js');
    const pptxPath = await generatePresentationPptx();
    res.download(pptxPath, 'Reconciliation_Studio_Presentation.pptx');
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/presentation/generate', async (req: Request, res: Response) => {
  try {
    const { generatePresentationPptx } = await import('../services/presentationGenerator.js');
    const pptxPath = await generatePresentationPptx();
    res.json({ success: true, message: 'Presentasi PowerPoint (.pptx) berhasil digenerate.', path: pptxPath });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
