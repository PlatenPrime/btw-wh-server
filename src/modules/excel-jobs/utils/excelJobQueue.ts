import { Worker } from "node:worker_threads";
import { getMongoUri } from "../../../config/getMongoUri.js";
import { ExcelJob } from "../models/ExcelJob.js";
import { executeExcelJobInProcess } from "./executeExcelJobInProcess.js";

export type ExcelJobExecutor = (jobId: string) => Promise<void>;

const queuedIds: string[] = [];
let runningId: string | null = null;
let runningWorker: Worker | null = null;
let customExecutor: ExcelJobExecutor | undefined;

export function setExcelJobExecutor(executor: ExcelJobExecutor | undefined): void {
  customExecutor = executor;
}

export function getExcelJobQueueSnapshot(): {
  queuedIds: string[];
  runningId: string | null;
} {
  return { queuedIds: [...queuedIds], runningId };
}

export function getExcelJobQueuePosition(jobId: string): number | null {
  if (runningId === jobId) {
    return 0;
  }
  const index = queuedIds.indexOf(jobId);
  if (index === -1) {
    return null;
  }
  return index + 1;
}

export function enqueueExcelJob(jobId: string): void {
  if (queuedIds.includes(jobId) || runningId === jobId) {
    return;
  }
  queuedIds.push(jobId);
  void pumpExcelJobQueue();
}

export function removeExcelJobFromQueue(jobId: string): boolean {
  const index = queuedIds.indexOf(jobId);
  if (index === -1) {
    return false;
  }
  queuedIds.splice(index, 1);
  return true;
}

export async function requestExcelJobCancel(
  jobId: string,
): Promise<"queued" | "running" | "none"> {
  if (removeExcelJobFromQueue(jobId)) {
    return "queued";
  }
  if (runningId === jobId) {
    runningWorker?.terminate();
    return "running";
  }
  return "none";
}

export function resetExcelJobQueueForTests(): void {
  queuedIds.length = 0;
  runningId = null;
  runningWorker = null;
  customExecutor = undefined;
}

async function pumpExcelJobQueue(): Promise<void> {
  if (runningId) {
    return;
  }
  const nextId = queuedIds.shift();
  if (!nextId) {
    return;
  }
  runningId = nextId;
  try {
    const executor = customExecutor ?? defaultExcelJobExecutor;
    await executor(nextId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await ExcelJob.updateOne(
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
    runningWorker = null;
    void pumpExcelJobQueue();
  }
}

async function defaultExcelJobExecutor(jobId: string): Promise<void> {
  if (process.env.VITEST) {
    await executeExcelJobInProcess(jobId);
    return;
  }
  await runExcelJobInWorker(jobId);
}

function runExcelJobInWorker(jobId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../worker/excelJobWorker.js", import.meta.url), {
      workerData: { jobId, mongoUri: getMongoUri() },
    });
    runningWorker = worker;
    worker.once("error", reject);
    worker.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Excel worker exited with code ${code}`));
    });
  });
}

export async function recoverExcelJobsOnStartup(): Promise<void> {
  await ExcelJob.updateMany(
    { status: "running" },
    {
      $set: {
        status: "failed",
        phase: "finalizing",
        progress: 100,
        error: "Server restarted during Excel job",
      },
    },
  );
  const queuedJobs = await ExcelJob.find({ status: "queued" })
    .sort({ createdAt: 1 })
    .select("_id")
    .lean();
  for (const job of queuedJobs) {
    enqueueExcelJob(String(job._id));
  }
}
