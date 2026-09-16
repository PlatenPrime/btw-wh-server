import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export function getExcelJobsDir(): string {
  return process.env.EXCEL_JOBS_DIR ?? path.join(os.tmpdir(), "btw-excel-jobs");
}

export function getExcelJobFilePath(jobId: string): string {
  return path.join(getExcelJobsDir(), `${jobId}.xlsx`);
}

export async function ensureExcelJobsDir(): Promise<string> {
  const dir = getExcelJobsDir();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function removeExcelJobFile(filePath: string | undefined): Promise<void> {
  if (!filePath) {
    return;
  }
  await fs.unlink(filePath).catch(() => undefined);
}
