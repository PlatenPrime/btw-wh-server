import fs from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";
import { ExcelJob } from "../../models/ExcelJob.js";
import { executeExcelJobInProcess } from "../executeExcelJobInProcess.js";
import { ensureExcelJobsDir, getExcelJobFilePath } from "../excelJobFilePaths.js";
import { expireAndCleanupExcelJobs } from "../expireAndCleanupExcelJobs.js";
import {
  enqueueExcelJob,
  getExcelJobQueuePosition,
  recoverExcelJobsOnStartup,
  resetExcelJobQueueForTests,
  setExcelJobExecutor,
} from "../excelJobQueue.js";

describe("excel job runtime utils", () => {
  afterEach(() => {
    resetExcelJobQueueForTests();
  });

  it("executeExcelJobInProcess writes grabo xlsx and marks ready", async () => {
    const job = await ExcelJob.create({
      userId: "u1",
      kind: "grabo-skus",
      params: {},
      status: "queued",
      phase: "queued",
      progress: 0,
      expiresAt: new Date(Date.now() + 60_000),
    });
    await executeExcelJobInProcess(String(job._id));
    const reloaded = await ExcelJob.findById(job._id);
    expect(reloaded?.status).toBe("ready");
    expect(reloaded?.progress).toBe(100);
    expect(reloaded?.fileName).toMatch(/\.xlsx$/);
    await expect(fs.stat(getExcelJobFilePath(String(job._id)))).resolves.toBeDefined();
    await fs.unlink(getExcelJobFilePath(String(job._id))).catch(() => undefined);
  });

  it("executeExcelJobInProcess marks failed for unknown kind stored on doc", async () => {
    const job = await ExcelJob.create({
      userId: "u1",
      kind: "nope",
      params: {},
      status: "queued",
      phase: "queued",
      progress: 0,
      expiresAt: new Date(Date.now() + 60_000),
    });
    await executeExcelJobInProcess(String(job._id));
    const reloaded = await ExcelJob.findById(job._id);
    expect(reloaded?.status).toBe("failed");
  });

  it("expireAndCleanupExcelJobs expires ready files and removes orphans", async () => {
    await ensureExcelJobsDir();
    const job = await ExcelJob.create({
      userId: "u1",
      kind: "grabo-skus",
      params: {},
      status: "ready",
      phase: "finalizing",
      progress: 100,
      fileName: "x.xlsx",
      filePath: getExcelJobFilePath("orphan-test"),
      expiresAt: new Date(Date.now() - 1000),
    });
    await fs.writeFile(job.filePath!, Buffer.from("x"));
    const orphanPath = getExcelJobFilePath("orphan-id");
    await fs.writeFile(orphanPath, Buffer.from("y"));

    const result = await expireAndCleanupExcelJobs(new Date());
    expect(result.expired).toBe(1);
    const reloaded = await ExcelJob.findById(job._id);
    expect(reloaded?.status).toBe("expired");
    expect(result.orphanFilesRemoved).toBeGreaterThanOrEqual(1);
  });

  it("queue position is 0 for running and 1+ for queued", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    setExcelJobExecutor(async () => {
      await gate;
    });
    const first = await ExcelJob.create({
      userId: "u1",
      kind: "grabo-skus",
      params: {},
      status: "queued",
      phase: "queued",
      progress: 0,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const second = await ExcelJob.create({
      userId: "u1",
      kind: "grabo-skus",
      params: {},
      status: "queued",
      phase: "queued",
      progress: 0,
      expiresAt: new Date(Date.now() + 60_000),
    });
    enqueueExcelJob(String(first._id));
    enqueueExcelJob(String(second._id));
    await new Promise((resolve) => setImmediate(resolve));
    expect(getExcelJobQueuePosition(String(first._id))).toBe(0);
    expect(getExcelJobQueuePosition(String(second._id))).toBe(1);
    release();
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  it("recoverExcelJobsOnStartup fails running and requeues queued", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const running = await ExcelJob.create({
      userId: "u1",
      kind: "grabo-skus",
      params: {},
      status: "running",
      phase: "building",
      progress: 40,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const queued = await ExcelJob.create({
      userId: "u1",
      kind: "grabo-skus",
      params: {},
      status: "queued",
      phase: "queued",
      progress: 0,
      expiresAt: new Date(Date.now() + 60_000),
    });
    setExcelJobExecutor(async () => {
      await gate;
    });
    await recoverExcelJobsOnStartup();
    await new Promise((resolve) => setImmediate(resolve));
    const failed = await ExcelJob.findById(running._id);
    expect(failed?.status).toBe("failed");
    expect(getExcelJobQueuePosition(String(queued._id))).toBe(0);
    release();
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
});
