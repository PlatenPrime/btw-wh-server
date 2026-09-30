import { ApiTask } from "../../../models/ApiTask.js";
import { expireAndCleanupApiTasks } from "../../../utils/expireAndCleanupApiTasks.js";
import { toApiTaskPublicData } from "../../../utils/toApiTaskPublicData.js";

export type GetApiTaskResult =
  | { ok: true; data: ReturnType<typeof toApiTaskPublicData> }
  | { ok: false; status: 403 | 404; message: string };

export async function getApiTaskUtil(input: {
  id: string;
  userId: string;
}): Promise<GetApiTaskResult> {
  await expireAndCleanupApiTasks();
  const task = await ApiTask.findById(input.id);
  if (!task) {
    return { ok: false, status: 404, message: "Api task not found" };
  }
  if (task.userId !== input.userId) {
    return { ok: false, status: 403, message: "Api task belongs to another user" };
  }
  return {
    ok: true,
    data: toApiTaskPublicData(task),
  };
}
