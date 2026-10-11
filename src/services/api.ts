import {
  DatabaseItem,
  TableItem,
  ColumnItem,
  ModuleItem,
  MatchingRuleItem,
  JobItem,
  ScheduleItem,
  JobExecutionItem,
  ExecutionLogItem,
  ReconciliationResultItem,
  AuditLogItem,
  SystemHealth
} from '../types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errMsg = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const errObj = await res.json();
      if (errObj && errObj.error) {
        errMsg = errObj.error;
      }
    } catch {}
    throw new Error(errMsg);
  }

  return res.json();
}

export const api = {
  // Health & System
  getHealth: () => request<SystemHealth>('/api/health'),
  resetSystem: () => request<{ success: boolean; message: string }>('/api/system/reset', { method: 'POST' }),

  // Databases
  getDatabases: () => request<DatabaseItem[]>('/api/databases'),
  createDatabase: (data: { name: string; description?: string }) =>
    request<DatabaseItem>('/api/databases', { method: 'POST', body: JSON.stringify(data) }),
  updateDatabase: (id: string, data: { name?: string; description?: string }) =>
    request<{ success: boolean; name: string }>(`/api/databases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDatabase: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/databases/${id}`, { method: 'DELETE' }),

  // Tables
  getTablesByDatabase: (dbName: string) => request<TableItem[]>(`/api/databases/${dbName}/tables`),
  getTableDetail: (id: string) => request<TableItem>(`/api/tables/${id}`),
  createTable: (dbName: string, data: {
    tableName: string;
    description?: string;
    columns: {
      columnName: string;
      dataType: string;
      maxLength?: number | null;
      isNullable?: boolean;
      isPrimaryKey?: boolean;
      isUnique?: boolean;
      defaultValue?: string | null;
    }[];
  }) => request<TableItem>(`/api/databases/${dbName}/tables`, { method: 'POST', body: JSON.stringify(data) }),
  deleteTable: (id: string) => request<{ success: boolean; message: string }>(`/api/tables/${id}`, { method: 'DELETE' }),
  previewSqlDdl: (data: { databaseName: string; tableName: string; columns: any[] }) =>
    request<{ physicalTableName: string; sql: string }>('/api/tables/preview-sql', { method: 'POST', body: JSON.stringify(data) }),

  // Records / Data Explorer
  getTableRecords: (tableId: string, params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortDir?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.search) q.set('search', params.search);
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    if (params?.sortDir) q.set('sortDir', params.sortDir);
    return request<{
      records: any[];
      columns: ColumnItem[];
      table: TableItem;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/tables/${tableId}/records?${q.toString()}`);
  },
  insertRecord: (tableId: string, record: Record<string, any>) =>
    request<{ success: boolean; record: any }>(`/api/tables/${tableId}/records`, { method: 'POST', body: JSON.stringify(record) }),
  updateRecord: (tableId: string, recordId: string, updates: Record<string, any>) =>
    request<{ success: boolean }>(`/api/tables/${tableId}/records/${recordId}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteRecord: (tableId: string, recordId: string) =>
    request<{ success: boolean }>(`/api/tables/${tableId}/records/${recordId}`, { method: 'DELETE' }),
  generateSampleRecords: (tableId: string, count: number = 5) =>
    request<{ success: boolean; count: number; message: string }>(`/api/tables/${tableId}/generate-sample`, { method: 'POST', body: JSON.stringify({ count }) }),
  importCsv: (tableId: string, csvContent: string) =>
    request<{ success: boolean; insertedCount: number }>(`/api/tables/${tableId}/import-csv`, { method: 'POST', body: JSON.stringify({ csvContent }) }),

  // Query Runner
  executeQuery: (sql: string) =>
    request<{ success: boolean; rowCount: number; columns: string[]; rows: any[] }>('/api/query/execute', { method: 'POST', body: JSON.stringify({ sql }) }),

  // Modules
  getModules: () => request<ModuleItem[]>('/api/modules'),
  createModule: (data: any) => request<ModuleItem>('/api/modules', { method: 'POST', body: JSON.stringify(data) }),
  deleteModule: (id: string) => request<{ success: boolean; message: string }>(`/api/modules/${id}`, { method: 'DELETE' }),
  previewModuleMatching: (data: any) => request<any>('/api/modules/preview-matching', { method: 'POST', body: JSON.stringify(data) }),

  // Rules
  getMatchingRules: () => request<MatchingRuleItem[]>('/api/matching-rules'),
  createMatchingRule: (data: any) => request<MatchingRuleItem>('/api/matching-rules', { method: 'POST', body: JSON.stringify(data) }),

  // Jobs
  getJobs: () => request<JobItem[]>('/api/jobs'),
  createJob: (data: any) => request<JobItem>('/api/jobs', { method: 'POST', body: JSON.stringify(data) }),
  deleteJob: (id: string) => request<{ success: boolean; message: string }>(`/api/jobs/${id}`, { method: 'DELETE' }),
  runJob: (id: string) => request<{ success: boolean; message: string; executionId: string; status: string; matchedCount: number; unmatchedCount: number }>(`/api/jobs/${id}/run`, { method: 'POST' }),
  duplicateJob: (id: string) => request<{ success: boolean; id: string; jobName: string }>(`/api/jobs/${id}/duplicate`, { method: 'POST' }),

  // Schedules
  getSchedules: () => request<ScheduleItem[]>('/api/schedules'),
  createSchedule: (data: any) => request<ScheduleItem>('/api/schedules', { method: 'POST', body: JSON.stringify(data) }),

  // Executions
  getExecutions: () => request<JobExecutionItem[]>('/api/job-executions'),
  getExecutionDetail: (id: string) => request<JobExecutionItem>(`/api/job-executions/${id}`),
  getExecutionLogs: (id: string) => request<ExecutionLogItem[]>(`/api/job-executions/${id}/logs`),

  // Results
  getReconciliationResults: (params?: { executionId?: string; status?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.executionId) q.set('executionId', params.executionId);
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return request<{
      results: ReconciliationResultItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      execution: JobExecutionItem | null;
    }>(`/api/reconciliation-results?${q.toString()}`);
  },

  // Reports
  getReportsSummary: () => request<any>('/api/reports/summary'),

  // Audit Logs
  getAuditLogs: (limit: number = 50) => request<AuditLogItem[]>(`/api/audit-logs?limit=${limit}`),
};
