import { ExcelJob } from "../../../models/ExcelJob.js";
import { expireAndCleanupExcelJobs } from "../../../utils/expireAndCleanupExcelJobs.js";
import { toExcelJobPublicData } from "../../../utils/toExcelJobPublicData.js";

export type GetExcelJobResult =
  | { ok: true; data: ReturnType<typeof toExcelJobPublicData> }
  | { ok: false; status: 403 | 404; message: string };

export async function getExcelJobUtil(input: {
  id: string;
  userId: string;
}): Promise<GetExcelJobResult> {
  await expireAndCleanupExcelJobs();
  const job = await ExcelJob.findById(input.id);
  if (!job) {
    return { ok: false, status: 404, message: "Excel job not found" };
  }
  if (job.userId !== input.userId) {
    return { ok: false, status: 403, message: "Excel job belongs to another user" };
  }
  return {
    ok: true,
    data: toExcelJobPublicData(job, { includeDownloadToken: true }),
  };
}
