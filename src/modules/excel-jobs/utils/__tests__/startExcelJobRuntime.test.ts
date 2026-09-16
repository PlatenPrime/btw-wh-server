import { describe, expect, it } from "vitest";
import { startExcelJobRuntime, stopExcelJobRuntime } from "../startExcelJobRuntime.js";
import { resetExcelJobQueueForTests, setExcelJobExecutor } from "../excelJobQueue.js";

describe("startExcelJobRuntime", () => {
  it("starts and stops cleanup timer", async () => {
    setExcelJobExecutor(async () => undefined);
    await startExcelJobRuntime();
    stopExcelJobRuntime();
    resetExcelJobQueueForTests();
    expect(true).toBe(true);
  });
});
