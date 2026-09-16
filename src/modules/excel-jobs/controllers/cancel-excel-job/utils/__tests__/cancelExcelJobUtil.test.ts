import { afterEach, describe, expect, it } from "vitest";
import { ExcelJob } from "../../../../models/ExcelJob.js";
import { resetExcelJobQueueForTests } from "../../../../utils/excelJobQueue.js";
import { cancelExcelJobUtil } from "../cancelExcelJobUtil.js";

describe("cancelExcelJobUtil", () => {
  afterEach(() => {
    resetExcelJobQueueForTests();
  });

  it("cancels queued job", async () => {
    const job = await ExcelJob.create({
      userId: "u1",
      kind: "grabo-skus",
      params: {},
      status: "queued",
      expiresAt: new Date(Date.now() + 60_000),
    });
    const result = await cancelExcelJobUtil({ id: String(job._id), userId: "u1" });
    expect(result.ok).toBe(true);
    const reloaded = await ExcelJob.findById(job._id);
    expect(reloaded?.status).toBe("cancelled");
  });

  it("409 when already ready", async () => {
    const job = await ExcelJob.create({
      userId: "u1",
      kind: "grabo-skus",
      params: {},
      status: "ready",
      fileName: "a.xlsx",
      expiresAt: new Date(Date.now() + 60_000),
    });
    const result = await cancelExcelJobUtil({ id: String(job._id), userId: "u1" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });
});
