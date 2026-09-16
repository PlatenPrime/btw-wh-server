import { ExcelJob } from "../../../models/ExcelJob.js";
import { expireAndCleanupExcelJobs } from "../../../utils/expireAndCleanupExcelJobs.js";
import { toExcelJobPublicData } from "../../../utils/toExcelJobPublicData.js";

export async function listExcelJobsUtil(input: {
  userId: string;
  status?: string[];
}): Promise<ReturnType<typeof toExcelJobPublicData>[]> {
  await expireAndCleanupExcelJobs();
  const filter: Record<string, unknown> = { userId: input.userId };
  if (input.status && input.status.length > 0) {
    filter.status = { $in: input.status };
  }
  const jobs = await ExcelJob.find(filter).sort({ createdAt: -1 }).limit(50);
  return jobs.map((job) =>
    toExcelJobPublicData(job, { includeDownloadToken: job.status === "ready" }),
  );
}
