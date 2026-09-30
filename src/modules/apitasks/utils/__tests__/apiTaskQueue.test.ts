import { afterEach, describe, expect, it } from "vitest";
import { ApiTask } from "../../models/ApiTask.js";
import {
  recoverApiTasksOnStartup,
  resetApiTaskQueueForTests,
  getApiTaskQueuePosition,
  setApiTaskExecutor,
} from "../apiTaskQueue.js";

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
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
});
