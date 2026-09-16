import { hasRoleAccess } from "../../../../../constants/roles.js";
import {
  EXCEL_JOB_MAX_ACTIVE_PER_USER,
  EXCEL_JOB_POLL_INTERVAL_MS,
  EXCEL_JOB_QUEUED_TTL_MS,
  type ExcelJobKind,
} from "../../../constants/excelJobConstants.js";
import { getExcelJobKindDefinition } from "../../../kinds/excelJobKindDefinitions.js";
import { ExcelJob } from "../../../models/ExcelJob.js";
import { enqueueExcelJob } from "../../../utils/excelJobQueue.js";
import { toExcelJobPublicData } from "../../../utils/toExcelJobPublicData.js";

export type CreateExcelJobResult =
  | {
      ok: true;
      status: 202;
      data: ReturnType<typeof toExcelJobPublicData> & { pollIntervalMs: number };
    }
  | { ok: false; status: 400; message: string; errors?: unknown }
  | { ok: false; status: 403; message: string }
  | { ok: false; status: 429; message: string };

export async function createExcelJobUtil(input: {
  kind: ExcelJobKind;
  params: Record<string, unknown>;
  userId: string;
  userRole: string;
}): Promise<CreateExcelJobResult> {
  const definition = getExcelJobKindDefinition(input.kind);
  if (!definition) {
    return { ok: false, status: 400, message: "Unknown excel job kind" };
  }
  if (!hasRoleAccess(input.userRole, definition.minRole)) {
    return {
      ok: false,
      status: 403,
      message: "Доступ запрещен: недостаточно прав",
    };
  }

  const parsedParams = definition.schema.safeParse(input.params);
  if (!parsedParams.success) {
    return {
      ok: false,
      status: 400,
      message: "Validation error",
      errors: parsedParams.error.errors,
    };
  }

  const activeCount = await ExcelJob.countDocuments({
    userId: input.userId,
    status: { $in: ["queued", "running"] },
  });
  if (activeCount >= EXCEL_JOB_MAX_ACTIVE_PER_USER) {
    return {
      ok: false,
      status: 429,
      message: `Too many active Excel jobs (max ${EXCEL_JOB_MAX_ACTIVE_PER_USER})`,
    };
  }

  const job = await ExcelJob.create({
    userId: input.userId,
    kind: input.kind,
    params: input.params,
    status: "queued",
    phase: "queued",
    progress: 0,
    expiresAt: new Date(Date.now() + EXCEL_JOB_QUEUED_TTL_MS),
  });

  enqueueExcelJob(String(job._id));

  return {
    ok: true,
    status: 202,
    data: {
      ...toExcelJobPublicData(job, { includeDownloadToken: false }),
      pollIntervalMs: EXCEL_JOB_POLL_INTERVAL_MS,
    },
  };
}
