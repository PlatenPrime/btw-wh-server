import { afterEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../../../../constants/roles.js";
import { ExcelJob } from "../../../../models/ExcelJob.js";
import {
  getExcelJobQueueSnapshot,
  resetExcelJobQueueForTests,
  setExcelJobExecutor,
} from "../../../../utils/excelJobQueue.js";
import { createExcelJobUtil } from "../createExcelJobUtil.js";

describe("createExcelJobUtil", () => {
  afterEach(() => {
    resetExcelJobQueueForTests();
  });

  it("rejects unknown kind params", async () => {
    const result = await createExcelJobUtil({
      kind: "sku-konk-sales",
      params: { konk: "air" },
      userId: "u1",
      userRole: RoleType.ADMIN,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it("rejects USER role", async () => {
    const result = await createExcelJobUtil({
      kind: "grabo-skus",
      params: {},
      userId: "u1",
      userRole: RoleType.USER,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
    }
  });

  it("returns 429 when user already has two active jobs", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    setExcelJobExecutor(async () => {
      await gate;
    });

    const first = await createExcelJobUtil({
      kind: "grabo-skus",
      params: {},
      userId: "u-limit",
      userRole: RoleType.ADMIN,
    });
    const second = await createExcelJobUtil({
      kind: "grabo-skus",
      params: {},
      userId: "u-limit",
      userRole: RoleType.ADMIN,
    });
    const third = await createExcelJobUtil({
      kind: "grabo-skus",
      params: {},
      userId: "u-limit",
      userRole: RoleType.ADMIN,
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(third.ok).toBe(false);
    if (!third.ok) {
      expect(third.status).toBe(429);
    }
    expect(getExcelJobQueueSnapshot().queuedIds.length + (getExcelJobQueueSnapshot().runningId ? 1 : 0)).toBeGreaterThanOrEqual(1);
    release();
    await ExcelJob.deleteMany({ userId: "u-limit" });
  });
});
