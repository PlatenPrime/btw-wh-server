import fs from "node:fs/promises";
import { ExcelJob } from "../../../models/ExcelJob.js";
import { verifyExcelDownloadToken } from "../../../utils/excelDownloadTokenUtil.js";
import { expireAndCleanupExcelJobs } from "../../../utils/expireAndCleanupExcelJobs.js";

export type DownloadExcelJobFileResult =
  | {
      ok: true;
      filePath: string;
      fileName: string;
      sizeBytes: number;
    }
  | { ok: false; status: 401 | 403 | 404 | 409 | 410; message: string };

export async function downloadExcelJobFileUtil(input: {
  id: string;
  token: string;
}): Promise<DownloadExcelJobFileResult> {
  const payload = verifyExcelDownloadToken(input.token);
  if (!payload) {
    return { ok: false, status: 401, message: "Invalid or expired download token" };
  }
  if (payload.jobId !== input.id) {
    return { ok: false, status: 403, message: "Download token does not match job" };
  }

  await expireAndCleanupExcelJobs();
  const job = await ExcelJob.findById(input.id);
  if (!job) {
    return { ok: false, status: 404, message: "Excel job not found" };
  }
  if (job.userId !== payload.userId) {
    return { ok: false, status: 403, message: "Excel job belongs to another user" };
  }
  if (job.status === "expired") {
    return { ok: false, status: 410, message: "Excel job file expired" };
  }
  if (job.status !== "ready" || !job.filePath || !job.fileName) {
    return { ok: false, status: 409, message: "Excel job file is not ready" };
  }

  try {
    const stat = await fs.stat(job.filePath);
    return {
      ok: true,
      filePath: job.filePath,
      fileName: job.fileName,
      sizeBytes: stat.size,
    };
  } catch {
    return { ok: false, status: 410, message: "Excel job file is missing" };
  }
}
