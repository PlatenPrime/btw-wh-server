import { ApiTask } from "../models/ApiTask.js";
import { executeApiTaskInProcess } from "./executeApiTaskInProcess.js";

export type ApiTaskExecutor = (taskId: string) => Promise<void>;

const queuedIds: string[] = [];
let runningId: string | null = null;
let runningAbort: AbortController | null = null;
let customExecutor: ApiTaskExecutor | undefined;

export function setApiTaskExecutor(executor: ApiTaskExecutor | undefined): void {
  customExecutor = executor;
}

export function getApiTaskQueueSnapshot(): {
  queuedIds: string[];
  runningId: string | null;
} {
  return { queuedIds: [...queuedIds], runningId };
}

export function getApiTaskQueuePosition(taskId: string): number | null {
  if (runningId === taskId) {
    return 0;
  }
  const index = queuedIds.indexOf(taskId);
  if (index === -1) {
    return null;
  }
  return index + 1;
}

export function enqueueApiTask(taskId: string): void {
  if (queuedIds.includes(taskId) || runningId === taskId) {
    return;
  }
  queuedIds.push(taskId);
  void pumpApiTaskQueue();
}

export function removeApiTaskFromQueue(taskId: string): boolean {
  const index = queuedIds.indexOf(taskId);
  if (index === -1) {
    return false;
  }
  queuedIds.splice(index, 1);
  return true;
}

export async function requestApiTaskCancel(
  taskId: string,
): Promise<"queued" | "running" | "none"> {
  if (removeApiTaskFromQueue(taskId)) {
    return "queued";
  }
  if (runningId === taskId) {
    runningAbort?.abort();
    return "running";
  }
  return "none";
}

export function resetApiTaskQueueForTests(): void {
  queuedIds.length = 0;
  runningId = null;
  runningAbort = null;
  customExecutor = undefined;
}

async function pumpApiTaskQueue(): Promise<void> {
  if (runningId) {
    return;
  }
  const nextId = queuedIds.shift();
  if (!nextId) {
    return;
  }
  runningId = nextId;
  runningAbort = new AbortController();
  try {
    const executor = customExecutor ?? defaultApiTaskExecutor;
    await executor(nextId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await ApiTask.updateOne(
      { _id: nextId, status: "running" },
      {
        $set: {
          status: "failed",
          phase: "finalizing",
          progress: 100,
          error: message,
        },
      },
    );
  } finally {
    runningId = null;
    runningAbort = null;
    void pumpApiTaskQueue();
  }
}

async function defaultApiTaskExecutor(taskId: string): Promise<void> {
  await executeApiTaskInProcess(taskId, {
    signal: runningAbort?.signal,
  });
}

export async function recoverApiTasksOnStartup(): Promise<void> {
  await ApiTask.updateMany(
    { status: "running" },
    {
      $set: {
        status: "failed",
        phase: "finalizing",
        progress: 100,
        error: "Server restarted during API task",
      },
    },
  );
  const queuedTasks = await ApiTask.find({ status: "queued" })
    .sort({ createdAt: 1 })
    .select("_id")
    .lean();
  for (const task of queuedTasks) {
    enqueueApiTask(String(task._id));
  }
}
