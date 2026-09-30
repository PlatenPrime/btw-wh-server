import { ApiTask } from "../../../models/ApiTask.js";
import { expireAndCleanupApiTasks } from "../../../utils/expireAndCleanupApiTasks.js";
import { toApiTaskPublicData } from "../../../utils/toApiTaskPublicData.js";

export async function listApiTasksUtil(input: {
  userId: string;
  status?: string[];
}): Promise<ReturnType<typeof toApiTaskPublicData>[]> {
  await expireAndCleanupApiTasks();
  const filter: Record<string, unknown> = { userId: input.userId };
  if (input.status && input.status.length > 0) {
    filter.status = { $in: input.status };
  }
  const tasks = await ApiTask.find(filter).sort({ createdAt: -1 }).limit(50);
  return tasks.map((task) => toApiTaskPublicData(task));
}
