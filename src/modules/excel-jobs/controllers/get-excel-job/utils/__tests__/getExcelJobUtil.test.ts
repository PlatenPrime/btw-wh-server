import { describe, expect, it } from "vitest";
import { ExcelJob } from "../../../../models/ExcelJob.js";
import { getExcelJobUtil } from "../getExcelJobUtil.js";

describe("getExcelJobUtil", () => {
  it("404 when missing", async () => {
    const result = await getExcelJobUtil({
      id: "64b0c0c0c0c0c0c0c0c0c0c0",
      userId: "u1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });

  it("403 when other user", async () => {
    const job = await ExcelJob.create({
      userId: "owner",
      kind: "grabo-skus",
      params: {},
      expiresAt: new Date(Date.now() + 60_000),
    });
    const result = await getExcelJobUtil({
      id: String(job._id),
      userId: "other",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("returns public data for owner", async () => {
    const job = await ExcelJob.create({
      userId: "owner",
      kind: "grabo-skus",
      params: {},
      expiresAt: new Date(Date.now() + 60_000),
    });
    const result = await getExcelJobUtil({
      id: String(job._id),
      userId: "owner",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.kind).toBe("grabo-skus");
      expect(result.data.downloadToken).toBeUndefined();
    }
  });
});
