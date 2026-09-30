import { afterEach, describe, expect, it } from "vitest";
import { ApiTask } from "../../../../models/ApiTask.js";
import {
  enqueueApiTask,
  resetApiTaskQueueForTests,
  setApiTaskExecutor,
} from "../../../../utils/apiTaskQueue.js";
import { cancelApiTaskUtil } from "../cancelApiTaskUtil.js";

describe("cancelApiTaskUtil", () => {
  afterEach(() => {
    resetApiTaskQueueForTests();
  });

  it("cancels queued task", async () => {
    setApiTaskExecutor(async () => undefined);
    const task = await ApiTask.create({
      userId: "u1",
      kind: "grabo-skus.sync",
      params: {},
      status: "queued",
      expiresAt: new Date(Date.now() + 60_000),
    });
    enqueueApiTask(String(task._id));

    const result = await cancelApiTaskUtil({
      id: String(task._id),
      userId: "u1",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe("cancelled");
    }
  });

  it("409 for completed task", async () => {
    const task = await ApiTask.create({
      userId: "u1",
      kind: "grabo-skus.sync",
      params: {},
      status: "completed",
      progress: 100,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const result = await cancelApiTaskUtil({
      id: String(task._id),
      userId: "u1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(409);
    }
  });
});
