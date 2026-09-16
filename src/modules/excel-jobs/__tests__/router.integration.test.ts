import fs from "node:fs/promises";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import app from "../../../test/utils/testApp.js";
import { ExcelJob } from "../models/ExcelJob.js";
import { getExcelJobFilePath } from "../utils/excelJobFilePaths.js";
import {
  resetExcelJobQueueForTests,
  setExcelJobExecutor,
} from "../utils/excelJobQueue.js";

const createAuthHeader = (role: RoleType = RoleType.ADMIN, userId?: string) => {
  const secret =
    process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
  const token = jwt.sign(
    { id: userId ?? new mongoose.Types.ObjectId().toString(), role },
    secret,
    { expiresIn: "1h" },
  );
  return { Authorization: `Bearer ${token}` };
};

async function waitForJobReady(jobId: string, headers: Record<string, string>) {
  for (let i = 0; i < 40; i++) {
    const response = await request(app)
      .get(`/api/excel-jobs/${jobId}`)
      .set(headers);
    if (response.status === 200 && response.body.data.status === "ready") {
      return response.body.data as {
        status: string;
        downloadToken: string;
        fileName: string;
        sizeBytes: number;
        progress: number;
      };
    }
    if (response.status === 200 && response.body.data.status === "failed") {
      throw new Error(response.body.data.error ?? "job failed");
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("job did not become ready");
}

describe("excel-jobs router", () => {
  afterEach(async () => {
    resetExcelJobQueueForTests();
    const jobs = await ExcelJob.find({});
    for (const job of jobs) {
      if (job.filePath) {
        await fs.unlink(job.filePath).catch(() => undefined);
      }
    }
  });

  it("401 without auth on POST", async () => {
    await request(app).post("/api/excel-jobs").send({ kind: "grabo-skus" }).expect(401);
  });

  it("403 for USER on POST", async () => {
    await request(app)
      .post("/api/excel-jobs")
      .set(createAuthHeader(RoleType.USER))
      .send({ kind: "grabo-skus" })
      .expect(403);
  });

  it("400 for unknown kind", async () => {
    await request(app)
      .post("/api/excel-jobs")
      .set(createAuthHeader())
      .send({ kind: "nope" })
      .expect(400);
  });

  it("creates grabo job, reports progress, then downloads file", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const headers = createAuthHeader(RoleType.ADMIN, userId);

    const created = await request(app)
      .post("/api/excel-jobs")
      .set(headers)
      .send({ kind: "grabo-skus", params: {} })
      .expect(202);

    expect(created.body.data.jobId).toBeDefined();
    expect(created.body.data.pollIntervalMs).toBe(1000);
    const jobId = created.body.data.jobId as string;

    const ready = await waitForJobReady(jobId, headers);
    expect(ready.progress).toBe(100);
    expect(ready.downloadToken).toBeTruthy();
    expect(ready.fileName).toMatch(/\.xlsx$/);
    expect(ready.sizeBytes).toBeGreaterThan(0);

    const listed = await request(app).get("/api/excel-jobs").set(headers).expect(200);
    expect(listed.body.data).toHaveLength(1);

    const file = await request(app)
      .get(`/api/excel-jobs/${jobId}/file`)
      .query({ token: ready.downloadToken })
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);

    expect(file.headers["content-type"]).toContain("spreadsheetml.sheet");
    expect(Number(file.headers["content-length"])).toBe(ready.sizeBytes);
    expect(Buffer.isBuffer(file.body)).toBe(true);
    expect((file.body as Buffer).length).toBe(ready.sizeBytes);

    await expect(fs.stat(getExcelJobFilePath(jobId))).resolves.toBeDefined();
  });

  it("409 when downloading before ready", async () => {
    const job = await ExcelJob.create({
      userId: new mongoose.Types.ObjectId().toString(),
      kind: "grabo-skus",
      params: {},
      status: "queued",
      phase: "queued",
      progress: 0,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const secret =
      process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
    const token = jwt.sign(
      { typ: "excel-dl", jobId: String(job._id), userId: job.userId },
      secret,
      { expiresIn: "5m" },
    );
    await request(app)
      .get(`/api/excel-jobs/${String(job._id)}/file`)
      .query({ token })
      .expect(409);
  });

  it("401 on download with garbage token", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    await request(app)
      .get(`/api/excel-jobs/${id}/file`)
      .query({ token: "bad" })
      .expect(401);
  });

  it("cancels a queued job", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    setExcelJobExecutor(async () => {
      await gate;
    });
    const userId = new mongoose.Types.ObjectId().toString();
    const headers = createAuthHeader(RoleType.ADMIN, userId);
    const created = await request(app)
      .post("/api/excel-jobs")
      .set(headers)
      .send({ kind: "grabo-skus" })
      .expect(202);
    const second = await request(app)
      .post("/api/excel-jobs")
      .set(headers)
      .send({ kind: "grabo-skus" })
      .expect(202);
    await request(app)
      .delete(`/api/excel-jobs/${second.body.data.jobId}`)
      .set(headers)
      .expect(200);
    const cancelled = await ExcelJob.findById(second.body.data.jobId);
    expect(cancelled?.status).toBe("cancelled");
    release();
    await ExcelJob.findById(created.body.data.jobId);
  });

  it("403 when another user reads the job", async () => {
    const owner = new mongoose.Types.ObjectId().toString();
    const created = await request(app)
      .post("/api/excel-jobs")
      .set(createAuthHeader(RoleType.ADMIN, owner))
      .send({ kind: "grabo-skus" })
      .expect(202);
    const other = createAuthHeader(RoleType.ADMIN, new mongoose.Types.ObjectId().toString());
    await request(app)
      .get(`/api/excel-jobs/${created.body.data.jobId}`)
      .set(other)
      .expect(403);
  });
});
