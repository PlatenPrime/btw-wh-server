import fs from "node:fs/promises";
import { isExcelJobKind } from "../constants/excelJobConstants.js";
import { EXCEL_JOB_READY_TTL_MS } from "../constants/excelJobConstants.js";
import { runExcelJobKind } from "../kinds/runExcelJobKind.js";
import { ExcelJob } from "../models/ExcelJob.js";
import {
  ensureExcelJobsDir,
  getExcelJobFilePath,
  removeExcelJobFile,
} from "./excelJobFilePaths.js";

async function jobIsCancelled(jobId: string): Promise<boolean> {
  const job = await ExcelJob.findById(jobId).select("status").lean();
  return job?.status === "cancelled";
}

async function patchRunningJob(
  jobId: string,
  fields: Record<string, unknown>,
): Promise<boolean> {
  const updated = await ExcelJob.updateOne(
    { _id: jobId, status: "running" },
    { $set: fields },
  );
  return updated.modifiedCount > 0;
}

export async function executeExcelJobInProcess(jobId: string): Promise<void> {
  const job = await ExcelJob.findById(jobId);
  if (!job) {
    return;
  }
  if (job.status === "cancelled") {
    return;
  }
  if (!isExcelJobKind(job.kind)) {
    job.status = "failed";
    job.error = `Unknown excel job kind: ${job.kind}`;
    job.progress = 100;
    await job.save();
    return;
  }

  job.status = "running";
  job.phase = "loading";
  job.progress = 5;
  await job.save();

  try {
    const stillRunning = await patchRunningJob(jobId, {
      phase: "building",
      progress: 15,
    });
    if (!stillRunning) {
      return;
    }

    const result = await runExcelJobKind(job.kind, job.params ?? {}, {
      onProgress: (done, total) => {
        const progress = 20 + Math.round((70 * done) / Math.max(total, 1));
        void patchRunningJob(jobId, { phase: "building", progress });
      },
    });

    if (await jobIsCancelled(jobId)) {
      return;
    }

    if (!result.ok) {
      await ExcelJob.updateOne(
        { _id: jobId, status: "running" },
        {
          $set: {
            status: "failed",
            phase: "finalizing",
            progress: 100,
            error: result.error,
          },
        },
      );
      return;
    }

    await patchRunningJob(jobId, { phase: "finalizing", progress: 95 });
    await ensureExcelJobsDir();
    const filePath = getExcelJobFilePath(jobId);
    await fs.writeFile(filePath, result.buffer);
    const stat = await fs.stat(filePath);

    if (await jobIsCancelled(jobId)) {
      await removeExcelJobFile(filePath);
      return;
    }

    const markedReady = await ExcelJob.updateOne(
      { _id: jobId, status: "running" },
      {
        $set: {
          status: "ready",
          phase: "finalizing",
          progress: 100,
          fileName: result.fileName,
          filePath,
          sizeBytes: stat.size,
          expiresAt: new Date(Date.now() + EXCEL_JOB_READY_TTL_MS),
        },
      },
    );
    if (markedReady.modifiedCount === 0) {
      await removeExcelJobFile(filePath);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await ExcelJob.updateOne(
      { _id: jobId, status: "running" },
      {
        $set: {
          status: "failed",
          phase: "finalizing",
          progress: 100,
          error: message,
        },
      },
    );
  }
}
