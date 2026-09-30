import { afterEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../../../../constants/roles.js";
import { ApiTask } from "../../../../models/ApiTask.js";
import {
  getApiTaskQueueSnapshot,
  resetApiTaskQueueForTests,
  setApiTaskExecutor,
} from "../../../../utils/apiTaskQueue.js";
import { createApiTaskUtil } from "../createApiTaskUtil.js";

describe("createApiTaskUtil", () => {
  afterEach(() => {
    resetApiTaskQueueForTests();
  });

  it("rejects invalid params for kind", async () => {
    const result = await createApiTaskUtil({
      kind: "sku-slices.skugr-run-today",
      params: { skugrId: "bad" },
      userId: "u1",
      userRole: RoleType.ADMIN,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it("rejects USER for ADMIN kind", async () => {
    const result = await createApiTaskUtil({
      kind: "grabo-skus.sync",
      params: {},
      userId: "u1",
      userRole: RoleType.USER,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
    }
  });

  it("returns 429 when user already has max active tasks", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    setApiTaskExecutor(async () => {
      await gate;
    });

    const first = await createApiTaskUtil({
      kind: "grabo-skus.sync",
      params: {},
      userId: "u-limit",
      userRole: RoleType.ADMIN,
    });
    const second = await createApiTaskUtil({
      kind: "arts.btrade-stock-update-all",
      params: {},
      userId: "u-limit",
      userRole: RoleType.ADMIN,
    });
    const third = await createApiTaskUtil({
      kind: "blocks.recalculate-zones-sectors",
      params: {},
      userId: "u-limit",
      userRole: RoleType.ADMIN,
    });
    const fourth = await createApiTaskUtil({
      kind: "poses.populate-missing-data",
      params: {},
      userId: "u-limit",
      userRole: RoleType.ADMIN,
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(third.ok).toBe(true);
    expect(fourth.ok).toBe(false);
    if (!fourth.ok) {
      expect(fourth.status).toBe(429);
    }
    expect(
      getApiTaskQueueSnapshot().queuedIds.length +
        (getApiTaskQueueSnapshot().runningId ? 1 : 0),
    ).toBeGreaterThanOrEqual(1);
    release();
    await ApiTask.deleteMany({ userId: "u-limit" });
  });

  it("returns 409 for duplicate resource key", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    setApiTaskExecutor(async () => {
      await gate;
    });

    const first = await createApiTaskUtil({
      kind: "grabo-skus.sync",
      params: {},
      userId: "u1",
      userRole: RoleType.ADMIN,
    });
    const second = await createApiTaskUtil({
      kind: "grabo-skus.sync",
      params: {},
      userId: "u2",
      userRole: RoleType.ADMIN,
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.status).toBe(409);
    }
    release();
    await ApiTask.deleteMany({});
  });
});
