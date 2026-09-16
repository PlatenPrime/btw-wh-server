export const EXCEL_JOB_STATUSES = [
  "queued",
  "running",
  "ready",
  "failed",
  "cancelled",
  "expired",
] as const;

export type ExcelJobStatus = (typeof EXCEL_JOB_STATUSES)[number];

export const EXCEL_JOB_PHASES = [
  "queued",
  "loading",
  "building",
  "finalizing",
] as const;

export type ExcelJobPhase = (typeof EXCEL_JOB_PHASES)[number];

export const EXCEL_JOB_KIND_IDS = [
  "sku-catalog-new-since",
  "sku-catalog-invalid",
  "sku-konk-stock",
  "sku-konk-sales",
  "sku-skugr-stock",
  "sku-skugr-sales",
  "sku-one-stock",
  "sku-one-sales",
  "art-stock",
  "art-sales",
  "analog-comparison",
  "analog-sales-comparison",
  "konk-btrade-comparison",
  "konk-btrade-sales-comparison",
  "arts-export",
  "arts-export-with-stocks",
  "arts-export-keys",
  "poses-export-stocks",
  "zones-export",
  "grabo-skus",
] as const;

export type ExcelJobKind = (typeof EXCEL_JOB_KIND_IDS)[number];

export const EXCEL_JOBS_MIGRATED_CODE = "EXCEL_JOBS_MIGRATED";
export const EXCEL_JOBS_DOCS_PATH = "docs/api/excel-jobs.md";
export const EXCEL_JOBS_FRONTEND_DOCS_PATH = "docs/api/excel-jobs-frontend.md";

export const EXCEL_JOB_POLL_INTERVAL_MS = 1000;
export const EXCEL_JOB_MAX_ACTIVE_PER_USER = 2;
export const EXCEL_JOB_READY_TTL_MS = 30 * 60 * 1000;
export const EXCEL_JOB_QUEUED_TTL_MS = 2 * 60 * 60 * 1000;
export const EXCEL_DOWNLOAD_TOKEN_EXPIRES = "5m";
export const EXCEL_DOWNLOAD_TOKEN_TYP = "excel-dl";

export const EXCEL_JOB_ACTIVE_STATUSES: ExcelJobStatus[] = ["queued", "running"];

export function isExcelJobKind(value: string): value is ExcelJobKind {
  return (EXCEL_JOB_KIND_IDS as readonly string[]).includes(value);
}

export function isExcelJobStatus(value: string): value is ExcelJobStatus {
  return (EXCEL_JOB_STATUSES as readonly string[]).includes(value);
}
