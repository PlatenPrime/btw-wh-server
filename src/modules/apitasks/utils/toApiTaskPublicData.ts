import type { IApiTask } from "../models/ApiTask.js";
import { getApiTaskQueuePosition } from "./apiTaskQueue.js";

export type ApiTaskPublicData = {
  taskId: string;
  kind: string;
  status: string;
  phase: string;
  progress: number;
  queuePosition: number | null;
  message?: string;
  result?: Record<string, unknown>;
  error?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export function toApiTaskPublicData(task: IApiTask): ApiTaskPublicData {
  const data: ApiTaskPublicData = {
    taskId: String(task._id),
    kind: task.kind,
    status: task.status,
    phase: task.phase,
    progress: task.progress,
    queuePosition: getApiTaskQueuePosition(String(task._id)),
    expiresAt: task.expiresAt.toISOString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
  if (task.message) {
    data.message = task.message;
  }
  if (task.result) {
    data.result = task.result;
  }
  if (task.error) {
    data.error = task.error;
  }
  return data;
}
