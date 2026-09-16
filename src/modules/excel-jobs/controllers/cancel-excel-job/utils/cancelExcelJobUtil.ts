import { ExcelJob } from "../../../models/ExcelJob.js";
import { removeExcelJobFile } from "../../../utils/excelJobFilePaths.js";
import { requestExcelJobCancel } from "../../../utils/excelJobQueue.js";
import { toExcelJobPublicData } from "../../../utils/toExcelJobPublicData.js";

export type CancelExcelJobResult =
  | { ok: true; data: ReturnType<typeof toExcelJobPublicData> }
  | { ok: false; status: 403 | 404 | 409; message: string };

export async function cancelExcelJobUtil(input: {
  id: string;
  userId: string;
}): Promise<CancelExcelJobResult> {
  const job = await ExcelJob.findById(input.id);
  if (!job) {
    return { ok: false, status: 404, message: "Excel job not found" };
  }
  if (job.userId !== input.userId) {
    return { ok: false, status: 403, message: "Excel job belongs to another user" };
  }
  if (job.status !== "queued" && job.status !== "running") {
    return {
      ok: false,
      status: 409,
      message: `Excel job cannot be cancelled in status ${job.status}`,
    };
  }

  job.status = "cancelled";
  job.phase = "finalizing";
  job.progress = 100;
  await job.save();
  await requestExcelJobCancel(String(job._id));
  await removeExcelJobFile(job.filePath);
  job.filePath = undefined;
  await job.save();

  return {
    ok: true,
    data: toExcelJobPublicData(job, { includeDownloadToken: false }),
  };
}
