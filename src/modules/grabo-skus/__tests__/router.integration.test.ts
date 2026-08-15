import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import app from "../../../test/utils/testApp.js";
import { clearGraboSkuSyncForTests } from "../utils/graboSkuSyncLock.js";

vi.mock("../utils/runGraboSkuSyncUtil.js", () => ({
  runGraboSkuSyncUtil: vi.fn().mockResolvedValue({
    categoryCount: 0,
    listed: 0,
    created: 0,
    updated: 0,
    skippedNoProductId: 0,
    errors: 0,
    markedOffSite: 0,
    catalogComplete: true,
  }),
}));

vi.mock("../../../cron/analytics-notifications/sendCronAnalyticsReport.js", () => ({
  sendCronAnalyticsReport: vi.fn(),
}));

const createAuthHeader = (role: RoleType = RoleType.ADMIN) => {
  const secret =
    process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
  const token = jwt.sign(
    { id: new mongoose.Types.ObjectId().toString(), role },
    secret,
    { expiresIn: "1h" }
  );
  return { Authorization: `Bearer ${token}` };
};

describe("grabo-skus router integration", () => {
  afterEach(() => {
    clearGraboSkuSyncForTests();
  });

  it("401 without JWT on GET /", async () => {
    await request(app).get("/api/grabo-skus").expect(401);
  });

  it("401 without JWT on GET /id/:id", async () => {
    await request(app)
      .get("/api/grabo-skus/id/000000000000000000000000")
      .expect(401);
  });

  it("403 for USER on GET /", async () => {
    await request(app)
      .get("/api/grabo-skus")
      .set(createAuthHeader(RoleType.USER))
      .expect(403);
  });

  it("200 for ADMIN on GET /", async () => {
    const response = await request(app)
      .get("/api/grabo-skus")
      .set(createAuthHeader(RoleType.ADMIN))
      .expect(200);

    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 0,
    });
    expect(response.body).not.toHaveProperty("filterOptions");
  });

  it("401 without JWT on GET /excel", async () => {
    await request(app).get("/api/grabo-skus/excel").expect(401);
  });

  it("401 without JWT on POST /sync", async () => {
    await request(app).post("/api/grabo-skus/sync").expect(401);
  });

  it("403 for USER on GET /excel", async () => {
    await request(app)
      .get("/api/grabo-skus/excel")
      .set(createAuthHeader(RoleType.USER))
      .expect(403);
  });

  it("202 for ADMIN on POST /sync", async () => {
    const response = await request(app)
      .post("/api/grabo-skus/sync")
      .set(createAuthHeader(RoleType.ADMIN))
      .expect(202);

    expect(response.body.data.accepted).toBe(true);
  });
});
