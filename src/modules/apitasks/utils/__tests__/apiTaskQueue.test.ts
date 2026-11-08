import { afterEach, describe, expect, it } from "vitest";
import { ApiTask } from "../../models/ApiTask.js";
import {
  enqueueApiTask,
  getApiTaskQueuePosition,
  getApiTaskQueueSnapshot,
  recoverApiTasksOnStartup,
  requestApiTaskCancel,
  resetApiTaskQueueForTests,
  setApiTaskExecutor,
} from "../apiTaskQueue.js";

function tick(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("apiTaskQueue", () => {
  afterEach(() => {
    resetApiTaskQueueForTests();
  });

  it("recover marks running as failed and requeues queued", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const running = await ApiTask.create({
      userId: "u1",
      kind: "grabo-skus.sync",
      params: {},
      status: "running",
      expiresAt: new Date(Date.now() + 60_000),
    });
    const queued = await ApiTask.create({
      userId: "u1",
      kind: "arts.btrade-stock-update-all",
      params: {},
      status: "queued",
      expiresAt: new Date(Date.now() + 60_000),
    });
    setApiTaskExecutor(async () => {
      await gate;
    });

    await recoverApiTasksOnStartup();
    await new Promise((resolve) => setImmediate(resolve));

    const failed = await ApiTask.findById(running._id);
    expect(failed?.status).toBe("failed");
    expect(failed?.error).toContain("Server restarted");
    expect(getApiTaskQueuePosition(String(queued._id))).toBe(0);

    release();
    await tick(20);
  });

  it("cancel running frees slot and starts next queued task", async () => {
    let releaseA!: () => void;
    let releaseB!: () => void;
    const gateA = new Promise<void>((resolve) => {
      releaseA = resolve;
    });
    const gateB = new Promise<void>((resolve) => {
      releaseB = resolve;
    });
    const started: string[] = [];

    setApiTaskExecutor(async (taskId) => {
      started.push(taskId);
      if (taskId === "task-a") {
        await gateA;
        return;
      }
      await gateB;
    });

    enqueueApiTask("task-a");
    await tick(5);
    expect(getApiTaskQueueSnapshot().runningId).toBe("task-a");

    enqueueApiTask("task-b");
    expect(getApiTaskQueuePosition("task-b")).toBe(1);

    const cancelResult = await requestApiTaskCancel("task-a");
    expect(cancelResult).toBe("running");
    await tick(5);

    expect(getApiTaskQueueSnapshot().runningId).toBe("task-b");
    expect(getApiTaskQueuePosition("task-b")).toBe(0);
    expect(started).toEqual(["task-a", "task-b"]);

    // Orphaned A finally must not clear B's slot.
    releaseA();
    await tick(20);
    expect(getApiTaskQueueSnapshot().runningId).toBe("task-b");

    releaseB();
    await tick(20);
    expect(getApiTaskQueueSnapshot().runningId).toBeNull();
  });
});
