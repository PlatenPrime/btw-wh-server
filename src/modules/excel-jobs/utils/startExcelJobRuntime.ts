import { logModuleError } from "../../../logging/logModuleError.js";
import { expireAndCleanupExcelJobs } from "./expireAndCleanupExcelJobs.js";
import { recoverExcelJobsOnStartup } from "./excelJobQueue.js";

const CLEANUP_INTERVAL_MS = 60_000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

export async function startExcelJobRuntime(): Promise<void> {
  await recoverExcelJobsOnStartup();
  if (cleanupTimer) {
    return;
  }
  cleanupTimer = setInterval(() => {
    void expireAndCleanupExcelJobs().catch((error) => {
      logModuleError("excel-jobs", error, "Excel job file cleanup failed");
    });
  }, CLEANUP_INTERVAL_MS);
  cleanupTimer.unref?.();
}

export function stopExcelJobRuntime(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
