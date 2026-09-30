import {
  API_TASK_COMPLETED_TTL_MS,
  isApiTaskKind,
} from "../constants/apiTaskConstants.js";
import {
  isApiTaskAbortedError,
  type ApiTaskRunOptions,
} from "../kinds/apiTaskRunTypes.js";
import { runApiTaskKind } from "../kinds/runApiTaskKind.js";
import { ApiTask } from "../models/ApiTask.js";

async function taskIsCancelled(taskId: string): Promise<boolean> {
  const task = await ApiTask.findById(taskId).select("status").lean();
  return task?.status === "cancelled";
}

async function patchRunningTask(
  taskId: string,
  fields: Record<string, unknown>,
): Promise<boolean> {
  const updated = await ApiTask.updateOne(
    { _id: taskId, status: "running" },
    { $set: fields },
  );
  return updated.modifiedCount > 0;
}

export async function executeApiTaskInProcess(
  taskId: string,
  runtimeOptions?: Pick<ApiTaskRunOptions, "signal">,
): Promise<void> {
  const task = await ApiTask.findById(taskId);
  if (!task) {
    return;
  }
  if (task.status === "cancelled") {
    return;
  }
  if (!isApiTaskKind(task.kind)) {
    task.status = "failed";
    task.error = `Unknown api task kind: ${task.kind}`;
    task.progress = 100;
    await task.save();
    return;
  }

  task.status = "running";
  task.phase = "preparing";
  task.progress = 5;
  task.message = "Preparing";
  await task.save();

  try {
    const stillRunning = await patchRunningTask(taskId, {
      phase: "running",
      progress: 10,
      message: "Running",
    });
    if (!stillRunning) {
      return;
    }

    const result = await runApiTaskKind(task.kind, task.params ?? {}, {
      signal: runtimeOptions?.signal,
      userId: task.userId,
      onProgress: (done, total, message) => {
        const progress = 10 + Math.round((80 * done) / Math.max(total, 1));
        void patchRunningTask(taskId, {
          phase: "running",
          progress: Math.min(progress, 90),
          ...(message ? { message } : {}),
        });
      },
    });

    if (await taskIsCancelled(taskId)) {
      return;
    }

    if (!result.ok) {
      await ApiTask.updateOne(
        { _id: taskId, status: "running" },
        {
          $set: {
            status: "failed",
            phase: "finalizing",
            progress: 100,
            error: result.error,
            message: "Failed",
          },
        },
      );
      return;
    }

    await patchRunningTask(taskId, {
      phase: "finalizing",
      progress: 95,
      message: "Finalizing",
    });

    if (await taskIsCancelled(taskId)) {
      return;
    }

    await ApiTask.updateOne(
      { _id: taskId, status: "running" },
      {
        $set: {
          status: "completed",
          phase: "finalizing",
          progress: 100,
          message: "Completed",
          result: result.result,
          expiresAt: new Date(Date.now() + API_TASK_COMPLETED_TTL_MS),
        },
      },
    );
  } catch (error) {
    if (isApiTaskAbortedError(error) || (await taskIsCancelled(taskId))) {
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    await ApiTask.updateOne(
      { _id: taskId, status: "running" },
      {
        $set: {
          status: "failed",
          phase: "finalizing",
          progress: 100,
          error: message,
          message: "Failed",
        },
      },
    );
  }
}
