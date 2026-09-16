import { beforeEach, describe, expect, it } from "vitest";
import { ExcelJob } from "../ExcelJob.js";

describe("ExcelJob model", () => {
  beforeEach(async () => {
    await ExcelJob.deleteMany({});
  });

  it("saves required fields with defaults", async () => {
    const job = await ExcelJob.create({
      userId: "user-1",
      kind: "grabo-skus",
      params: {},
      expiresAt: new Date(Date.now() + 60_000),
    });
    expect(job.status).toBe("queued");
    expect(job.phase).toBe("queued");
    expect(job.progress).toBe(0);
    expect(job.createdAt).toBeInstanceOf(Date);
  });

  it("fails without userId", async () => {
    const job = new ExcelJob({
      kind: "grabo-skus",
      expiresAt: new Date(),
    });
    await expect(job.save()).rejects.toThrow();
  });

  it("rejects invalid status", async () => {
    const job = new ExcelJob({
      userId: "u",
      kind: "grabo-skus",
      status: "nope",
      expiresAt: new Date(),
    });
    await expect(job.save()).rejects.toThrow();
  });
});
