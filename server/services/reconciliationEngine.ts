import { SqlJsDatabase } from 'sql.js';
import { executeSql, generatePhysicalTableName, queryAll, queryOne } from '../db/database.js';

export interface MatchingFieldConfig {
  sourceField: string;
  targetField: string;
}

export interface ComparisonFieldConfig {
  sourceField: string;
  targetField: string;
  comparisonType: 'EXACT' | 'AMOUNT' | 'DATE' | 'STATUS';
  tolerance?: number;
  toleranceDays?: number;
}

export interface ModuleConfig {
  matchingFields: MatchingFieldConfig[];
  comparisonFields: ComparisonFieldConfig[];
  filters?: {
    sourceFilter?: string;
    targetFilter?: string;
  };
  nullHandling?: 'FAIL_ON_NULL' | 'IGNORE_NULL' | 'MATCH_NULL';
  duplicatePolicy?: 'FLAG_AMBIGUOUS' | 'MATCH_FIRST';
}

export interface ReconciliationSummary {
  totalSource: number;
  totalTarget: number;
  totalTransactions: number;
  matchedCount: number;
  unmatchedCount: number;
  amountMismatchCount: number;
  dateMismatchCount: number;
  statusMismatchCount: number;
  sourceOnlyCount: number;
  targetOnlyCount: number;
  duplicateCount: number;
  invalidDataCount: number;
  pendingCount: number;
  matchingRate: number;
  totalSourceAmount: number;
  totalTargetAmount: number;
  netDifference: number;
}

export function executeReconciliationModule(
  db: SqlJsDatabase,
  executionId: string,
  moduleId: string,
  logCollector: (level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS', msg: string) => void
): ReconciliationSummary {
  logCollector('INFO', `[ENGINE] Menginisialisasi modul rekonsiliasi ID: ${moduleId}`);

  const moduleRow = queryOne(db, `SELECT * FROM _rms_modules WHERE id = ?`, [moduleId]);
  if (!moduleRow) {
    throw new Error(`Modul rekonsiliasi '${moduleId}' tidak ditemukan dalam katalog.`);
  }

  logCollector('INFO', `[ENGINE] Modul aktif: '${moduleRow.module_name}' (${moduleRow.source_database}.${moduleRow.source_table} -> ${moduleRow.target_database}.${moduleRow.target_table})`);

  let config: ModuleConfig;
  try {
    config = JSON.parse(moduleRow.matching_config);
  } catch (err) {
    throw new Error(`Konfigurasi matching JSON tidak valid pada modul ${moduleRow.module_name}`);
  }

  const sourcePhys = generatePhysicalTableName(moduleRow.source_database, moduleRow.source_table);
  const targetPhys = generatePhysicalTableName(moduleRow.target_database, moduleRow.target_table);

  // Check physical tables existence
  const tableCheck = queryAll(db, `SELECT name FROM sqlite_master WHERE type='table' AND name IN (?, ?)`, [sourcePhys, targetPhys]);
  if (tableCheck.length < 2) {
    throw new Error(`Tabel fisik ${sourcePhys} atau ${targetPhys} belum dibuat dalam database.`);
  }

  // Load records
  logCollector('INFO', `[ENGINE] Membaca data dari tabel sumber: ${sourcePhys}`);
  const sourceRows: any[] = queryAll(db, `SELECT * FROM "${sourcePhys}"`);
  logCollector('INFO', `[ENGINE] Data sumber berhasil dimuat: ${sourceRows.length} baris`);

  logCollector('INFO', `[ENGINE] Membaca data dari tabel target: ${targetPhys}`);
  const targetRows: any[] = queryAll(db, `SELECT * FROM "${targetPhys}"`);
  logCollector('INFO', `[ENGINE] Data target berhasil dimuat: ${targetRows.length} baris`);

  // Detect which fields are used for amount/quantity comparison
  const amountComp = config.comparisonFields.find(c => c.comparisonType === 'AMOUNT');
  const sourceAmountField = amountComp ? amountComp.sourceField : 'amount';
  const targetAmountField = amountComp ? amountComp.targetField : 'amount';

  const dateComp = config.comparisonFields.find(c => c.comparisonType === 'DATE');
  const sourceDateField = dateComp ? dateComp.sourceField : 'date';
  const targetDateField = dateComp ? dateComp.targetField : 'date';

  const statusComp = config.comparisonFields.find(c => c.comparisonType === 'STATUS');
  const sourceStatusField = statusComp ? statusComp.sourceField : 'status';
  const targetStatusField = statusComp ? statusComp.targetField : 'status';

  // Helper to extract numeric amount safely
  const extractAmount = (row: any, fieldName: string): number => {
    if (!row) return 0;
    if (row[fieldName] !== undefined && row[fieldName] !== null) {
      const parsed = parseFloat(String(row[fieldName]).replace(/[^0-9.-]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    // Fallback search in row for common numeric fields
    for (const key of Object.keys(row)) {
      if (key.includes('amount') || key.includes('total') || key.includes('price') || key.includes('quantity')) {
        const parsed = parseFloat(String(row[key]).replace(/[^0-9.-]/g, ''));
        if (!isNaN(parsed)) return parsed;
      }
    }
    return 0;
  };

  // Build matching keys and detect duplicates
  logCollector('INFO', `[ENGINE] Membangun indeks matching key (${config.matchingFields.map(m => m.sourceField).join(', ')}) dan deteksi duplikasi...`);

  const buildKey = (row: any, fields: MatchingFieldConfig[], isSource: boolean) => {
    return fields.map(f => {
      const col = isSource ? f.sourceField : f.targetField;
      const val = row[col];
      return val !== undefined && val !== null ? String(val).trim() : 'NULL';
    }).join('__');
  };

  const sourceKeyMap = new Map<string, any[]>();
  const targetKeyMap = new Map<string, any[]>();

  for (const s of sourceRows) {
    const key = buildKey(s, config.matchingFields, true);
    if (!sourceKeyMap.has(key)) sourceKeyMap.set(key, []);
    sourceKeyMap.get(key)!.push(s);
  }

  for (const t of targetRows) {
    const key = buildKey(t, config.matchingFields, false);
    if (!targetKeyMap.has(key)) targetKeyMap.set(key, []);
    targetKeyMap.get(key)!.push(t);
  }

  const duplicateSourceKeys = new Set<string>();
  const duplicateTargetKeys = new Set<string>();

  for (const [key, rows] of sourceKeyMap.entries()) {
    if (rows.length > 1) duplicateSourceKeys.add(key);
  }

  for (const [key, rows] of targetKeyMap.entries()) {
    if (rows.length > 1) duplicateTargetKeys.add(key);
  }

  if (duplicateSourceKeys.size > 0 || duplicateTargetKeys.size > 0) {
    logCollector('WARN', `[ENGINE] Terdeteksi duplikasi kunci: ${duplicateSourceKeys.size} pada sumber, ${duplicateTargetKeys.size} pada target`);
  }

  const results: any[] = [];
  const processedSourceIds = new Set<string>();
  const processedTargetIds = new Set<string>();

  let matchedCount = 0;
  let amountMismatchCount = 0;
  let dateMismatchCount = 0;
  let statusMismatchCount = 0;
  let sourceOnlyCount = 0;
  let targetOnlyCount = 0;
  let duplicateCount = 0;
  let invalidDataCount = 0;
  let pendingCount = 0;

  let totalSourceAmount = 0;
  let totalTargetAmount = 0;

  const now = new Date().toISOString();

  // 1. Handle Duplicates First
  for (const [key, rows] of sourceKeyMap.entries()) {
    if (duplicateSourceKeys.has(key)) {
      for (const s of rows) {
        processedSourceIds.add(s.id);
        duplicateCount++;
        const sAmt = extractAmount(s, sourceAmountField);
        totalSourceAmount += sAmt;
        results.push({
          id: 'REC-' + Math.random().toString(36).substring(2, 9),
          executionId,
          moduleId,
          sourceRecordId: s.id,
          targetRecordId: null,
          matchingKey: key,
          sourceAmount: sAmt,
          targetAmount: null,
          difference: sAmt,
          reconciliationStatus: 'DUPLICATE',
          reason: `Duplikasi kunci pada data sumber (${rows.length} record ditemukan dengan key '${key}')`,
          sourceDataJson: JSON.stringify(s),
          targetDataJson: null,
          createdAt: now
        });
      }
    }
  }

  for (const [key, rows] of targetKeyMap.entries()) {
    if (duplicateTargetKeys.has(key)) {
      for (const t of rows) {
        processedTargetIds.add(t.id);
        duplicateCount++;
        const tAmt = extractAmount(t, targetAmountField);
        totalTargetAmount += tAmt;
        results.push({
          id: 'REC-' + Math.random().toString(36).substring(2, 9),
          executionId,
          moduleId,
          sourceRecordId: null,
          targetRecordId: t.id,
          matchingKey: key,
          sourceAmount: null,
          targetAmount: tAmt,
          difference: -tAmt,
          reconciliationStatus: 'DUPLICATE',
          reason: `Duplikasi kunci pada data target (${rows.length} record ditemukan dengan key '${key}')`,
          sourceDataJson: null,
          targetDataJson: JSON.stringify(t),
          createdAt: now
        });
      }
    }
  }

  // 2. 1:1 Matching on valid non-duplicate source keys
  logCollector('INFO', `[ENGINE] Mengeksekusi perbandingan 1:1 aturan matching...`);

  for (const s of sourceRows) {
    if (processedSourceIds.has(s.id)) continue;

    const sAmt = extractAmount(s, sourceAmountField);
    totalSourceAmount += sAmt;

    const key = buildKey(s, config.matchingFields, true);
    const targetCandidates = targetKeyMap.get(key);

    if (!targetCandidates || targetCandidates.length === 0) {
      // Source only
      processedSourceIds.add(s.id);
      sourceOnlyCount++;
      results.push({
        id: 'REC-' + Math.random().toString(36).substring(2, 9),
        executionId,
        moduleId,
        sourceRecordId: s.id,
        targetRecordId: null,
        matchingKey: key,
        sourceAmount: sAmt,
        targetAmount: null,
        difference: sAmt,
        reconciliationStatus: 'SOURCE_ONLY',
        reason: `Catatan tercatat pada tabel sumber (${moduleRow.source_table}) namun tidak ditemukan pada target (${moduleRow.target_table})`,
        sourceDataJson: JSON.stringify(s),
        targetDataJson: null,
        createdAt: now
      });
      continue;
    }

    // Candidate exists
    const t = targetCandidates[0];
    if (processedTargetIds.has(t.id)) {
      // Already consumed target record
      processedSourceIds.add(s.id);
      sourceOnlyCount++;
      results.push({
        id: 'REC-' + Math.random().toString(36).substring(2, 9),
        executionId,
        moduleId,
        sourceRecordId: s.id,
        targetRecordId: null,
        matchingKey: key,
        sourceAmount: sAmt,
        targetAmount: null,
        difference: sAmt,
        reconciliationStatus: 'SOURCE_ONLY',
        reason: 'Target transaksi telah dikonsumsi oleh rekonsiliasi record lain (1:1 constraint)',
        sourceDataJson: JSON.stringify(s),
        targetDataJson: null,
        createdAt: now
      });
      continue;
    }

    // Process pairing (s and t)
    processedSourceIds.add(s.id);
    processedTargetIds.add(t.id);

    const tAmt = extractAmount(t, targetAmountField);
    totalTargetAmount += tAmt;
    const diff = Number((sAmt - tAmt).toFixed(2));

    // Evaluate comparison rules in priority order
    let classification: string = 'MATCHED';
    let reason: string = 'Transaksi cocok sempurna (100% Match)';

    // Status inspection
    const sStatus = s[sourceStatusField] !== undefined ? String(s[sourceStatusField]).toUpperCase() : '';
    const tStatus = t[targetStatusField] !== undefined ? String(t[targetStatusField]).toUpperCase() : '';

    // Check Pending Status
    if (sStatus === 'PENDING' || tStatus === 'PENDING') {
      classification = 'PENDING';
      reason = 'Status transaksi masih menunggu konfirmasi settlement (PENDING)';
      pendingCount++;
    } else {
      let amountMismatch = false;
      let dateMismatch = false;
      let statusMismatch = false;
      let amountMismatchDetails = '';
      let dateMismatchDetails = '';
      let statusMismatchDetails = '';

      for (const comp of config.comparisonFields) {
        const sVal = s[comp.sourceField];
        const tVal = t[comp.targetField];

        if (comp.comparisonType === 'AMOUNT') {
          const sNum = extractAmount(s, comp.sourceField);
          const tNum = extractAmount(t, comp.targetField);
          const tol = comp.tolerance !== undefined ? comp.tolerance : 0.00;
          const colDiff = Math.abs(sNum - tNum);
          if (colDiff > tol) {
            amountMismatch = true;
            amountMismatchDetails = `Selisih nominal (${comp.sourceField}): Sumber=${sNum.toLocaleString('id-ID')} vs Target=${tNum.toLocaleString('id-ID')} (Selisih: ${colDiff.toLocaleString('id-ID')})`;
          }
        } else if (comp.comparisonType === 'DATE') {
          const sDateStr = String(sVal || '').substring(0, 10);
          const tDateStr = String(tVal || '').substring(0, 10);
          const tolDays = comp.toleranceDays || 0;
          if (tolDays === 0) {
            if (sDateStr !== tDateStr) {
              dateMismatch = true;
              dateMismatchDetails = `Perbedaan tanggal (${comp.sourceField}): Sumber=${sDateStr} vs Target=${tDateStr}`;
            }
          } else {
            const d1 = new Date(sDateStr).getTime();
            const d2 = new Date(tDateStr).getTime();
            const diffDays = Math.abs(d1 - d2) / (1000 * 3600 * 24);
            if (diffDays > tolDays) {
              dateMismatch = true;
              dateMismatchDetails = `Perbedaan tanggal melebihi batas ${tolDays} hari: Sumber=${sDateStr} vs Target=${tDateStr}`;
            }
          }
        } else if (comp.comparisonType === 'STATUS') {
          const sStat = String(sVal || '').toUpperCase();
          const tStat = String(tVal || '').toUpperCase();
          if (sStat !== tStat) {
            statusMismatch = true;
            statusMismatchDetails = `Status tidak selaras (${comp.sourceField}): Sumber=${sVal} vs Target=${tVal}`;
          }
        } else if (comp.comparisonType === 'EXACT') {
          if (String(sVal || '') !== String(tVal || '')) {
            statusMismatch = true;
            statusMismatchDetails = `Nilai kolom ${comp.sourceField} berbeda: Sumber=${sVal} vs Target=${tVal}`;
          }
        }
      }

      // Priority determination
      if (amountMismatch) {
        classification = 'AMOUNT_MISMATCH';
        reason = amountMismatchDetails;
        amountMismatchCount++;
      } else if (dateMismatch) {
        classification = 'DATE_MISMATCH';
        reason = dateMismatchDetails;
        dateMismatchCount++;
      } else if (statusMismatch) {
        classification = 'STATUS_MISMATCH';
        reason = statusMismatchDetails;
        statusMismatchCount++;
      } else {
        classification = 'MATCHED';
        reason = 'Transaksi cocok sempurna (100% Match pada nominal, tanggal, status, dan referensi)';
        matchedCount++;
      }
    }

    results.push({
      id: 'REC-' + Math.random().toString(36).substring(2, 9),
      executionId,
      moduleId,
      sourceRecordId: s.id,
      targetRecordId: t.id,
      matchingKey: key,
      sourceAmount: sAmt,
      targetAmount: tAmt,
      difference: diff,
      reconciliationStatus: classification,
      reason,
      sourceDataJson: JSON.stringify(s),
      targetDataJson: JSON.stringify(t),
      createdAt: now
    });
  }

  // 3. Handle remaining unconsumed Target records -> TARGET_ONLY
  for (const t of targetRows) {
    if (processedTargetIds.has(t.id)) continue;

    const tAmt = extractAmount(t, targetAmountField);
    totalTargetAmount += tAmt;

    const key = buildKey(t, config.matchingFields, false);
    processedTargetIds.add(t.id);
    targetOnlyCount++;

    results.push({
      id: 'REC-' + Math.random().toString(36).substring(2, 9),
      executionId,
      moduleId,
      sourceRecordId: null,
      targetRecordId: t.id,
      matchingKey: key,
      sourceAmount: null,
      targetAmount: tAmt,
      difference: -tAmt,
      reconciliationStatus: 'TARGET_ONLY',
      reason: `Catatan terdapat pada target (${moduleRow.target_table}) namun tidak ditemukan pada sumber (${moduleRow.source_table})`,
      sourceDataJson: null,
      targetDataJson: JSON.stringify(t),
      createdAt: now
    });
  }

  // Save all results in real database
  logCollector('INFO', `[ENGINE] Menyimpan ${results.length} hasil rekonsiliasi ke tabel _rms_reconciliation_results...`);

  for (const r of results) {
    executeSql(db, `INSERT INTO _rms_reconciliation_results (
      id, execution_id, module_id, source_record_id, target_record_id, matching_key,
      source_amount, target_amount, difference, reconciliation_status, reason,
      source_data_json, target_data_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.id, r.executionId, r.moduleId, r.sourceRecordId, r.targetRecordId, r.matchingKey,
        r.sourceAmount, r.targetAmount, r.difference, r.reconciliationStatus, r.reason,
        r.sourceDataJson, r.targetDataJson, r.createdAt
      ]);
  }

  const unmatchedCount = amountMismatchCount + dateMismatchCount + statusMismatchCount + sourceOnlyCount + targetOnlyCount + duplicateCount + invalidDataCount + pendingCount;
  const totalTransactions = results.length;
  const matchingRate = totalTransactions > 0 ? Number(((matchedCount / totalTransactions) * 100).toFixed(2)) : 0;
  const netDifference = Number((totalSourceAmount - totalTargetAmount).toFixed(2));

  const summary: ReconciliationSummary = {
    totalSource: sourceRows.length,
    totalTarget: targetRows.length,
    totalTransactions,
    matchedCount,
    unmatchedCount,
    amountMismatchCount,
    dateMismatchCount,
    statusMismatchCount,
    sourceOnlyCount,
    targetOnlyCount,
    duplicateCount,
    invalidDataCount,
    pendingCount,
    matchingRate,
    totalSourceAmount,
    totalTargetAmount,
    netDifference
  };

  logCollector('SUCCESS', `[ENGINE] Rekonsiliasi selesai: ${matchedCount} MATCHED, ${unmatchedCount} UNMATCHED (Matching Rate: ${matchingRate}%)`);
  return summary;
}
