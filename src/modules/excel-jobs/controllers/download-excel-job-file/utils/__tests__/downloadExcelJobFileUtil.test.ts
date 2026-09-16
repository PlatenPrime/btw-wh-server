import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { ExcelJob } from "../../../../models/ExcelJob.js";
import {
  ensureExcelJobsDir,
  getExcelJobFilePath,
} from "../../../../utils/excelJobFilePaths.js";
import { createExcelDownloadToken } from "../../../../utils/excelDownloadTokenUtil.js";
import { downloadExcelJobFileUtil } from "../downloadExcelJobFileUtil.js";

describe("downloadExcelJobFileUtil", () => {
  it("401 for invalid token", async () => {
    const result = await downloadExcelJobFileUtil({
      id: "64b0c0c0c0c0c0c0c0c0c0c0",
      token: "bad",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("403 when token jobId mismatches path id", async () => {
    const token = createExcelDownloadToken("64b0c0c0c0c0c0c0c0c0c0c0", "u1");
    const result = await downloadExcelJobFileUtil({
      id: "64b0c0c0c0c0c0c0c0c0c0c1",
      token,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("409 when job is not ready", async () => {
    const job = await ExcelJob.create({
      userId: "u1",
      kind: "grabo-skus",
      params: {},
      status: "queued",
      expiresAt: new Date(Date.now() + 60_000),
    });
    const token = createExcelDownloadToken(String(job._id), "u1");
    const result = await downloadExcelJobFileUtil({
      id: String(job._id),
      token,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });

  it("returns file path and size when ready", async () => {
    const job = await ExcelJob.create({
      userId: "u1",
      kind: "grabo-skus",
      params: {},
      status: "ready",
      phase: "finalizing",
      progress: 100,
      fileName: "grabo.xlsx",
      expiresAt: new Date(Date.now() + 60_000),
    });
    await ensureExcelJobsDir();
    const filePath = getExcelJobFilePath(String(job._id));
    await fs.writeFile(filePath, Buffer.from("xlsx-bytes"));
    job.filePath = filePath;
    await job.save();
    const token = createExcelDownloadToken(String(job._id), "u1");
    const result = await downloadExcelJobFileUtil({
      id: String(job._id),
      token,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fileName).toBe("grabo.xlsx");
      expect(result.sizeBytes).toBe(10);
    }
    await fs.unlink(filePath).catch(() => undefined);
  });

  it("410 when ready file is missing on disk", async () => {
    const job = await ExcelJob.create({
      userId: "u1",
      kind: "grabo-skus",
      params: {},
      status: "ready",
      fileName: "gone.xlsx",
      filePath: getExcelJobFilePath("missing-file-id"),
      expiresAt: new Date(Date.now() + 60_000),
    });
    const token = createExcelDownloadToken(String(job._id), "u1");
    const result = await downloadExcelJobFileUtil({
      id: String(job._id),
      token,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(410);
  });
});
