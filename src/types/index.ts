export interface DatabaseItem {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  tables?: TableItem[];
}

export interface TableItem {
  id: string;
  database_id: string;
  database_name: string;
  table_name: string;
  physical_table_name: string;
  description: string;
  created_at: string;
  updated_at: string;
  columns?: ColumnItem[];
  rowCount?: number;
}

export interface ColumnItem {
  id: string;
  table_id: string;
  column_name: string;
  data_type: 'VARCHAR' | 'TEXT' | 'INTEGER' | 'BIGINT' | 'DECIMAL' | 'BOOLEAN' | 'DATE' | 'TIMESTAMP' | 'UUID';
  max_length?: number | null;
  is_nullable: number;
  is_primary_key: number;
  is_unique: number;
  default_value?: string | null;
  ordinal_position: number;
}

export interface ModuleItem {
  id: string;
  module_name: string;
  description: string;
  module_type: string;
  source_database: string;
  source_table: string;
  target_database: string;
  target_table: string;
  matching_config: {
    matchingFields: { sourceField: string; targetField: string }[];
    comparisonFields: {
      sourceField: string;
      targetField: string;
      comparisonType: 'EXACT' | 'AMOUNT' | 'DATE' | 'STATUS';
      tolerance?: number;
      toleranceDays?: number;
    }[];
    filters?: { sourceFilter?: string; targetFilter?: string };
    nullHandling?: string;
    duplicatePolicy?: string;
  };
  status: 'Draft' | 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export interface MatchingRuleItem {
  id: string;
  rule_name: string;
  rule_type: string;
  description: string;
  config: Record<string, any>;
  created_at: string;
}

export interface JobItem {
  id: string;
  job_name: string;
  description: string;
  module_ids: string[];
  execution_order: string[];
  dependencies: Record<string, string[]>;
  retry_limit: number;
  timeout_seconds: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  lastExecution?: JobExecutionItem | null;
}

export interface ScheduleItem {
  id: string;
  job_id: string;
  job_name?: string;
  schedule_name: string;
  cron_expression: string;
  timezone: string;
  is_active: number;
  last_execution?: string | null;
  next_planned_execution?: string | null;
  max_retries: number;
  created_at: string;
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

export interface JobExecutionItem {
  id: string;
  job_id: string;
  job_name: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | 'CANCELLED';
  start_time: string;
  end_time?: string | null;
  duration_ms?: number | null;
  total_source: number;
  total_target: number;
  matched_count: number;
  unmatched_count: number;
  error_count: number;
  summary_json?: string;
  summary?: ReconciliationSummary | null;
  error_message?: string | null;
  created_at: string;
  logs?: ExecutionLogItem[];
}

export interface ExecutionLogItem {
  id: string;
  execution_id: string;
  timestamp: string;
  log_level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
}

export interface ReconciliationResultItem {
  id: string;
  execution_id: string;
  module_id: string;
  source_record_id?: string | null;
  target_record_id?: string | null;
  matching_key?: string | null;
  source_amount?: number | null;
  target_amount?: number | null;
  difference?: number | null;
  reconciliation_status: 'MATCHED' | 'AMOUNT_MISMATCH' | 'DATE_MISMATCH' | 'STATUS_MISMATCH' | 'SOURCE_ONLY' | 'TARGET_ONLY' | 'DUPLICATE' | 'INVALID_DATA' | 'PENDING';
  reason?: string | null;
  source_data_json?: string | null;
  target_data_json?: string | null;
  sourceData?: Record<string, any> | null;
  targetData?: Record<string, any> | null;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  description: string;
  result: 'SUCCESS' | 'FAILED';
}

export interface SystemHealth {
  status: string;
  app: string;
  engine: string;
  storageNotice: string;
  databaseCount: number;
  timestamp: string;
}
