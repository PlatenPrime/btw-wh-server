import { describe, expect, it } from "vitest";
import { ExcelJob } from "../../../../models/ExcelJob.js";
import { listExcelJobsUtil } from "../listExcelJobsUtil.js";

describe("listExcelJobsUtil", () => {
  it("returns only current user jobs filtered by status", async () => {
    await ExcelJob.create({
      userId: "me",
      kind: "grabo-skus",
      params: {},
      status: "queued",
      expiresAt: new Date(Date.now() + 60_000),
    });
    await ExcelJob.create({
      userId: "me",
      kind: "zones-export",
      params: {},
      status: "ready",
      fileName: "z.xlsx",
      expiresAt: new Date(Date.now() + 60_000),
    });
    await ExcelJob.create({
      userId: "other",
      kind: "grabo-skus",
      params: {},
      expiresAt: new Date(Date.now() + 60_000),
    });

    const queued = await listExcelJobsUtil({ userId: "me", status: ["queued"] });
    expect(queued).toHaveLength(1);
    expect(queued[0]?.kind).toBe("grabo-skus");

    const allMine = await listExcelJobsUtil({ userId: "me" });
    expect(allMine).toHaveLength(2);
  });
});
