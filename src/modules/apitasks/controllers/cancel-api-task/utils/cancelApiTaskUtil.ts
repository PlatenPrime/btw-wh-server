import { ApiTask } from "../../../models/ApiTask.js";
import { requestApiTaskCancel } from "../../../utils/apiTaskQueue.js";
import { toApiTaskPublicData } from "../../../utils/toApiTaskPublicData.js";

export type CancelApiTaskResult =
  | { ok: true; data: ReturnType<typeof toApiTaskPublicData> }
  | { ok: false; status: 403 | 404 | 409; message: string };

export async function cancelApiTaskUtil(input: {
  id: string;
  userId: string;
}): Promise<CancelApiTaskResult> {
  const task = await ApiTask.findById(input.id);
  if (!task) {
    return { ok: false, status: 404, message: "Api task not found" };
  }
  if (task.userId !== input.userId) {
    return { ok: false, status: 403, message: "Api task belongs to another user" };
  }
  if (task.status !== "queued" && task.status !== "running") {
    return {
      ok: false,
      status: 409,
      message: `Api task cannot be cancelled in status ${task.status}`,
    };
  }

  task.status = "cancelled";
  task.phase = "finalizing";
  task.progress = 100;
  task.message = "Cancelled";
  await task.save();
  await requestApiTaskCancel(String(task._id));

  return {
    ok: true,
    data: toApiTaskPublicData(task),
  };
}
