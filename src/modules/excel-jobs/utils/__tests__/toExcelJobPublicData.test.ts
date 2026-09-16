import { describe, expect, it } from "vitest";
import { ExcelJob } from "../../models/ExcelJob.js";
import { toExcelJobPublicData } from "../toExcelJobPublicData.js";

describe("toExcelJobPublicData", () => {
  it("omits downloadToken unless ready and requested", async () => {
    const queued = await ExcelJob.create({
      userId: "u1",
      kind: "grabo-skus",
      params: {},
      expiresAt: new Date(Date.now() + 60_000),
    });
    const queuedData = toExcelJobPublicData(queued, { includeDownloadToken: true });
    expect(queuedData.downloadToken).toBeUndefined();

    queued.status = "ready";
    queued.fileName = "a.xlsx";
    queued.sizeBytes = 10;
    await queued.save();
    const ready = toExcelJobPublicData(queued, { includeDownloadToken: true });
    expect(ready.downloadToken).toBeTruthy();
    expect(ready.fileName).toBe("a.xlsx");
    expect(ready.sizeBytes).toBe(10);
  });
});
