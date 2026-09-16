import fs from "node:fs/promises";
import path from "node:path";
import { ExcelJob } from "../models/ExcelJob.js";
import { getExcelJobsDir, removeExcelJobFile } from "./excelJobFilePaths.js";

export async function expireAndCleanupExcelJobs(
  now: Date = new Date(),
): Promise<{ expired: number; orphanFilesRemoved: number }> {
  const expiredJobs = await ExcelJob.find({
    status: "ready",
    expiresAt: { $lte: now },
  });
  let expired = 0;
  for (const job of expiredJobs) {
    await removeExcelJobFile(job.filePath);
    job.status = "expired";
    job.filePath = undefined;
    await job.save();
    expired += 1;
  }

  let orphanFilesRemoved = 0;
  const dir = getExcelJobsDir();
  let names: string[] = [];
  try {
    names = await fs.readdir(dir);
  } catch {
    return { expired, orphanFilesRemoved };
  }

  const readyJobs = await ExcelJob.find({ status: "ready" }).select("_id").lean();
  const readyIds = new Set(readyJobs.map((job) => String(job._id)));
  for (const name of names) {
    if (!name.endsWith(".xlsx")) {
      continue;
    }
    const jobId = name.slice(0, -".xlsx".length);
    if (readyIds.has(jobId)) {
      continue;
    }
    await fs.unlink(path.join(dir, name)).catch(() => undefined);
    orphanFilesRemoved += 1;
  }
  return { expired, orphanFilesRemoved };
}
