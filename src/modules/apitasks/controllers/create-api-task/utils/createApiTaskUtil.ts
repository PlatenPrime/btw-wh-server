import { hasRoleAccess } from "../../../../../constants/roles.js";
import {
  API_TASK_MAX_ACTIVE_PER_USER,
  API_TASK_POLL_INTERVAL_MS,
  API_TASK_QUEUED_TTL_MS,
  type ApiTaskKind,
} from "../../../constants/apiTaskConstants.js";
import { getApiTaskKindDefinition } from "../../../kinds/apiTaskKindDefinitions.js";
import { ApiTask } from "../../../models/ApiTask.js";
import { enqueueApiTask } from "../../../utils/apiTaskQueue.js";
import { toApiTaskPublicData } from "../../../utils/toApiTaskPublicData.js";

export type CreateApiTaskResult =
  | {
      ok: true;
      status: 202;
      data: ReturnType<typeof toApiTaskPublicData> & { pollIntervalMs: number };
    }
  | { ok: false; status: 400; message: string; errors?: unknown }
  | { ok: false; status: 403; message: string }
  | { ok: false; status: 409; message: string }
  | { ok: false; status: 429; message: string };

export async function createApiTaskUtil(input: {
  kind: ApiTaskKind;
  params: Record<string, unknown>;
  userId: string;
  userRole: string;
}): Promise<CreateApiTaskResult> {
  const definition = getApiTaskKindDefinition(input.kind);
  if (!definition) {
    return { ok: false, status: 400, message: "Unknown api task kind" };
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

  const normalizedParams =
    parsedParams.data && typeof parsedParams.data === "object"
      ? (parsedParams.data as Record<string, unknown>)
      : input.params;

  const resourceKey = definition.getResourceKey?.(normalizedParams);

  if (resourceKey) {
    const duplicate = await ApiTask.findOne({
      kind: input.kind,
      resourceKey,
      status: { $in: ["queued", "running"] },
    })
      .select("_id")
      .lean();
    if (duplicate) {
      return {
        ok: false,
        status: 409,
        message: "Api task already in progress for this resource",
      };
    }
  }

  const activeCount = await ApiTask.countDocuments({
    userId: input.userId,
    status: { $in: ["queued", "running"] },
  });
  if (activeCount >= API_TASK_MAX_ACTIVE_PER_USER) {
    return {
      ok: false,
      status: 429,
      message: `Too many active API tasks (max ${API_TASK_MAX_ACTIVE_PER_USER})`,
    };
  }

  const task = await ApiTask.create({
    userId: input.userId,
    kind: input.kind,
    params: normalizedParams,
    ...(resourceKey ? { resourceKey } : {}),
    status: "queued",
    phase: "queued",
    progress: 0,
    expiresAt: new Date(Date.now() + API_TASK_QUEUED_TTL_MS),
  });

  enqueueApiTask(String(task._id));

  return {
    ok: true,
    status: 202,
    data: {
      ...toApiTaskPublicData(task),
      pollIntervalMs: API_TASK_POLL_INTERVAL_MS,
    },
  };
}
