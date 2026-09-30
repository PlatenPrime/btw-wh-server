export const API_TASK_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
  "expired",
] as const;

export type ApiTaskStatus = (typeof API_TASK_STATUSES)[number];

export const API_TASK_PHASES = [
  "queued",
  "preparing",
  "running",
  "finalizing",
] as const;

export type ApiTaskPhase = (typeof API_TASK_PHASES)[number];

export const API_TASK_KIND_IDS = [
  "sku-slices.skugr-run-today",
  "slice-compensation.run",
  "skugrs.fill-skus",
  "grabo-skus.sync",
  "arts.btrade-stock-update-all",
  "dels.artikuls-update-all",
  "pallet-groups.recalculate-pallets-sectors",
  "blocks.recalculate-zones-sectors",
  "poses.populate-missing-data",
  "skus.fix-incorrect-sku-data",
  "skus.delete-konk-invalid",
  "skus.delete-not-in-any-skugr",
  "arts.delete-without-latest-marker",
] as const;

export type ApiTaskKind = (typeof API_TASK_KIND_IDS)[number];

export const API_TASKS_MIGRATED_CODE = "API_TASKS_MIGRATED";
export const API_TASKS_DOCS_PATH = "docs/api/apitasks.md";
export const API_TASKS_FRONTEND_DOCS_PATH = "docs/api/apitasks-frontend.md";

export const API_TASK_POLL_INTERVAL_MS = 1000;
export const API_TASK_MAX_ACTIVE_PER_USER = 3;
export const API_TASK_COMPLETED_TTL_MS = 24 * 60 * 60 * 1000;
export const API_TASK_QUEUED_TTL_MS = 2 * 60 * 60 * 1000;

export const API_TASK_ACTIVE_STATUSES: ApiTaskStatus[] = ["queued", "running"];

export function isApiTaskKind(value: string): value is ApiTaskKind {
  return (API_TASK_KIND_IDS as readonly string[]).includes(value);
}

export function isApiTaskStatus(value: string): value is ApiTaskStatus {
  return (API_TASK_STATUSES as readonly string[]).includes(value);
}
