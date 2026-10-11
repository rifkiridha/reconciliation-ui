import { SqlJsDatabase } from 'sql.js';
import { executeSql, queryAll, queryOne, addAuditLog } from '../db/database.js';
import { executeReconciliationModule, ReconciliationSummary } from './reconciliationEngine.js';

const activeRunningJobs = new Set<string>();

export interface JobRunResult {
  executionId: string;
  jobId: string;
  jobName: string;
  status: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | 'CANCELLED';
  startTime: string;
  endTime: string;
  durationMs: number;
  totalSource: number;
  totalTarget: number;
  matchedCount: number;
  unmatchedCount: number;
  errorCount: number;
  summary: ReconciliationSummary | null;
  errorMessage?: string;
}

export async function runJob(db: SqlJsDatabase, jobId: string): Promise<JobRunResult> {
  const job = queryOne(db, `SELECT * FROM _rms_jobs WHERE id = ?`, [jobId]);
  if (!job) {
    throw new Error(`Job dengan ID '${jobId}' tidak ditemukan.`);
  }

  if (activeRunningJobs.has(jobId)) {
    throw new Error(`Job '${job.job_name}' sedang berjalan saat ini. Hindari eksekusi ganda bersamaan.`);
  }

  activeRunningJobs.add(jobId);

  const executionId = 'EXEC-' + new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const startTime = new Date().toISOString();
  const startTimestamp = Date.now();

  const logEvents: { level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'; msg: string; time: string }[] = [];

  const addLog = (level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS', msg: string) => {
    const time = new Date().toISOString();
    logEvents.push({ level, msg, time });
    executeSql(
      db,
      `INSERT INTO _rms_execution_logs (id, execution_id, timestamp, log_level, message) VALUES (?, ?, ?, ?, ?)`,
      ['LOG-' + Math.random().toString(36).substring(2, 9), executionId, time, level, msg]
    );
  };

  // Insert initial queued/running execution record
  executeSql(
    db,
    `INSERT INTO _rms_job_executions (id, job_id, job_name, status, start_time, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [executionId, job.id, job.job_name, 'RUNNING', startTime, startTime]
  );

  addLog('INFO', `[ORCHESTRATOR] Memulai eksekusi job: '${job.job_name}' (ID: ${executionId})`);
  addLog('INFO', `[ORCHESTRATOR] Memeriksa dependensi dan konfigurasi modul...`);

  try {
    let moduleIds: string[] = [];
    try {
      moduleIds = JSON.parse(job.module_ids);
    } catch {
      moduleIds = [job.module_ids];
    }

    if (!moduleIds || moduleIds.length === 0) {
      throw new Error(`Job '${job.job_name}' tidak memiliki modul rekonsiliasi yang terlampir.`);
    }

    addLog('INFO', `[ORCHESTRATOR] Terlampir ${moduleIds.length} modul rekonsiliasi. Menjalankan alur pemrosesan...`);

    let consolidatedSummary: ReconciliationSummary = {
      totalSource: 0,
      totalTarget: 0,
      totalTransactions: 0,
      matchedCount: 0,
      unmatchedCount: 0,
      amountMismatchCount: 0,
      dateMismatchCount: 0,
      statusMismatchCount: 0,
      sourceOnlyCount: 0,
      targetOnlyCount: 0,
      duplicateCount: 0,
      invalidDataCount: 0,
      pendingCount: 0,
      matchingRate: 0,
      totalSourceAmount: 0,
      totalTargetAmount: 0,
      netDifference: 0
    };

    for (const modId of moduleIds) {
      addLog('INFO', `[ORCHESTRATOR] Menjalankan modul rekonsiliasi: ${modId}`);
      const summary = executeReconciliationModule(db, executionId, modId, (lvl, msg) => {
        addLog(lvl, msg);
      });

      consolidatedSummary.totalSource += summary.totalSource;
      consolidatedSummary.totalTarget += summary.totalTarget;
      consolidatedSummary.totalTransactions += summary.totalTransactions;
      consolidatedSummary.matchedCount += summary.matchedCount;
      consolidatedSummary.unmatchedCount += summary.unmatchedCount;
      consolidatedSummary.amountMismatchCount += summary.amountMismatchCount;
      consolidatedSummary.dateMismatchCount += summary.dateMismatchCount;
      consolidatedSummary.statusMismatchCount += summary.statusMismatchCount;
      consolidatedSummary.sourceOnlyCount += summary.sourceOnlyCount;
      consolidatedSummary.targetOnlyCount += summary.targetOnlyCount;
      consolidatedSummary.duplicateCount += summary.duplicateCount;
      consolidatedSummary.invalidDataCount += summary.invalidDataCount;
      consolidatedSummary.pendingCount += summary.pendingCount;
      consolidatedSummary.totalSourceAmount += summary.totalSourceAmount;
      consolidatedSummary.totalTargetAmount += summary.totalTargetAmount;
    }

    if (consolidatedSummary.totalTransactions > 0) {
      consolidatedSummary.matchingRate = Number(((consolidatedSummary.matchedCount / consolidatedSummary.totalTransactions) * 100).toFixed(2));
    }
    consolidatedSummary.netDifference = Number((consolidatedSummary.totalSourceAmount - consolidatedSummary.totalTargetAmount).toFixed(2));

    const endTime = new Date().toISOString();
    const durationMs = Date.now() - startTimestamp;

    const finalStatus: 'SUCCESS' | 'PARTIAL_SUCCESS' =
      consolidatedSummary.unmatchedCount > 0 ? 'PARTIAL_SUCCESS' : 'SUCCESS';

    executeSql(
      db,
      `UPDATE _rms_job_executions SET 
        status = ?, end_time = ?, duration_ms = ?, total_source = ?, total_target = ?, 
        matched_count = ?, unmatched_count = ?, error_count = ?, summary_json = ? 
      WHERE id = ?`,
      [
        finalStatus,
        endTime,
        durationMs,
        consolidatedSummary.totalSource,
        consolidatedSummary.totalTarget,
        consolidatedSummary.matchedCount,
        consolidatedSummary.unmatchedCount,
        0,
        JSON.stringify(consolidatedSummary),
        executionId
      ]
    );

    // Update job last execution
    executeSql(
      db,
      `UPDATE _rms_job_schedules SET last_execution = ? WHERE job_id = ?`,
      [endTime, job.id]
    );

    addLog('SUCCESS', `[ORCHESTRATOR] Eksekusi job selesai dengan status ${finalStatus} dalam ${durationMs}ms`);
    addAuditLog(db, 'JOB_EXECUTED', 'JOB', job.id, `Job '${job.job_name}' dieksekusi dengan ID ${executionId}: Hasil ${finalStatus} (Match Rate: ${consolidatedSummary.matchingRate}%)`);

    return {
      executionId,
      jobId: job.id,
      jobName: job.job_name,
      status: finalStatus,
      startTime,
      endTime,
      durationMs,
      totalSource: consolidatedSummary.totalSource,
      totalTarget: consolidatedSummary.totalTarget,
      matchedCount: consolidatedSummary.matchedCount,
      unmatchedCount: consolidatedSummary.unmatchedCount,
      errorCount: 0,
      summary: consolidatedSummary
    };
  } catch (err: any) {
    const endTime = new Date().toISOString();
    const durationMs = Date.now() - startTimestamp;
    const errorMsg = err?.message || 'Terjadi kesalahan tidak terduga pada job orchestrator';

    addLog('ERROR', `[ORCHESTRATOR] Kegagalan eksekusi job: ${errorMsg}`);

    executeSql(
      db,
      `UPDATE _rms_job_executions SET 
        status = 'FAILED', end_time = ?, duration_ms = ?, error_count = 1, error_message = ? 
      WHERE id = ?`,
      [endTime, durationMs, errorMsg, executionId]
    );

    addAuditLog(db, 'JOB_FAILED', 'JOB', job.id, `Job '${job.job_name}' gagal: ${errorMsg}`, 'FAILED');

    return {
      executionId,
      jobId: job.id,
      jobName: job.job_name,
      status: 'FAILED',
      startTime,
      endTime,
      durationMs,
      totalSource: 0,
      totalTarget: 0,
      matchedCount: 0,
      unmatchedCount: 0,
      errorCount: 1,
      summary: null,
      errorMessage: errorMsg
    };
  } finally {
    activeRunningJobs.delete(jobId);
  }
}
