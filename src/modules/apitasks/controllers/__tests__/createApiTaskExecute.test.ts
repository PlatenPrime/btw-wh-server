import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoleType } from "../../../../constants/roles.js";
import { ApiTask } from "../../models/ApiTask.js";
import {
  resetApiTaskQueueForTests,
  setApiTaskExecutor,
} from "../../utils/apiTaskQueue.js";
import { executeApiTaskInProcess } from "../../utils/executeApiTaskInProcess.js";
import { createApiTaskUtil } from "../create-api-task/utils/createApiTaskUtil.js";

vi.mock("../../kinds/runApiTaskKind.js", () => ({
  runApiTaskKind: vi.fn(async () => ({
    ok: true,
    result: { ok: true },
  })),
}));

describe("createApiTaskController flow via util+execute", () => {
  beforeEach(() => {
    resetApiTaskQueueForTests();
  });

  afterEach(() => {
    resetApiTaskQueueForTests();
  });

  it("executes queued task to completed", async () => {
    setApiTaskExecutor(async (taskId) => {
      await executeApiTaskInProcess(taskId);
    });

    const created = await createApiTaskUtil({
      kind: "blocks.recalculate-zones-sectors",
      params: {},
      userId: "u-exec",
      userRole: RoleType.ADMIN,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    await vi.waitFor(async () => {
      const task = await ApiTask.findById(created.data.taskId);
      expect(task?.status).toBe("completed");
      expect(task?.progress).toBe(100);
      expect(task?.result).toEqual({ ok: true });
    });
  });
});
