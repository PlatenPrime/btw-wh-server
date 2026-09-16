import type { IExcelJob } from "../models/ExcelJob.js";
import { createExcelDownloadToken } from "./excelDownloadTokenUtil.js";
import { getExcelJobQueuePosition } from "./excelJobQueue.js";

export type ExcelJobPublicData = {
  jobId: string;
  kind: string;
  status: string;
  phase: string;
  progress: number;
  queuePosition: number | null;
  fileName?: string;
  sizeBytes?: number;
  downloadToken?: string;
  error?: string;
  expiresAt: string;
  createdAt: string;
};

export function toExcelJobPublicData(
  job: IExcelJob,
  options: { includeDownloadToken: boolean },
): ExcelJobPublicData {
  const data: ExcelJobPublicData = {
    jobId: String(job._id),
    kind: job.kind,
    status: job.status,
    phase: job.phase,
    progress: job.progress,
    queuePosition: getExcelJobQueuePosition(String(job._id)),
    expiresAt: job.expiresAt.toISOString(),
    createdAt: job.createdAt.toISOString(),
  };
  if (job.fileName) {
    data.fileName = job.fileName;
  }
  if (typeof job.sizeBytes === "number") {
    data.sizeBytes = job.sizeBytes;
  }
  if (job.error) {
    data.error = job.error;
  }
  if (options.includeDownloadToken && job.status === "ready") {
    data.downloadToken = createExcelDownloadToken(String(job._id), job.userId);
  }
  return data;
}
