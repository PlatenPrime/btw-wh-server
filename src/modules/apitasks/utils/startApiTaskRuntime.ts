import { logModuleError } from "../../../logging/logModuleError.js";
import { recoverApiTasksOnStartup } from "./apiTaskQueue.js";
import { expireAndCleanupApiTasks } from "./expireAndCleanupApiTasks.js";

const CLEANUP_INTERVAL_MS = 60_000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

export async function startApiTaskRuntime(): Promise<void> {
  await recoverApiTasksOnStartup();
  if (cleanupTimer) {
    return;
  }
  cleanupTimer = setInterval(() => {
    void expireAndCleanupApiTasks().catch((error) => {
      logModuleError("apitasks", error, "Api task cleanup failed");
    });
  }, CLEANUP_INTERVAL_MS);
  cleanupTimer.unref?.();
}

export function stopApiTaskRuntime(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
