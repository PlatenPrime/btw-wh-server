import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import app from "../../../test/utils/testApp.js";
import { Def } from "../models/Def.js";
import { getCalculationStatus } from "../utils/calculationStatus.js";

vi.mock("../utils/calculationStatus.js", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../utils/calculationStatus.js")
  >();
  return {
    ...actual,
    getCalculationStatus: vi.fn(),
  };
});

vi.mock(
  "../controllers/calculate-pogrebi-defs/utils/calculateAndSavePogrebiDefsUtil.js",
  () => ({
    calculateAndSavePogrebiDefsUtil: vi.fn(),
  })
);

import { calculateAndSavePogrebiDefsUtil } from "../controllers/calculate-pogrebi-defs/utils/calculateAndSavePogrebiDefsUtil.js";

const createAuthHeader = (role: RoleType = RoleType.USER) => {
  const secret =
    process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
  const token = jwt.sign(
    { id: new mongoose.Types.ObjectId().toString(), role },
    secret,
    { expiresIn: "1h" }
  );
  return { Authorization: `Bearer ${token}` };
};

const idleStatus = {
  isRunning: false,
  progress: 0,
  estimatedTimeRemaining: 0,
  startedAt: null,
  lastUpdate: null,
};

describe("Defs router integration", () => {
  beforeEach(async () => {
    await Def.deleteMany({});
    vi.clearAllMocks();
    vi.mocked(getCalculationStatus).mockReturnValue(idleStatus);
  });

  describe("GET /api/defs/latest", () => {
    it("401 without auth token", async () => {
      await request(app).get("/api/defs/latest").expect(401);
    });

    it("200 returns exists=false when no defs", async () => {
      const response = await request(app)
        .get("/api/defs/latest")
        .set(createAuthHeader(RoleType.USER))
        .expect(200);

      expect(response.body.exists).toBe(false);
      expect(response.body.data).toBeNull();
    });

    it("200 returns latest def for USER", async () => {
      await Def.create({
        result: {
          ART001: {
            nameukr: "Товар",
            quant: 10,
            sharikQuant: 5,
            difQuant: -5,
            defLimit: 30,
            status: "critical",
          },
        },
        total: 1,
        totalCriticalDefs: 1,
        totalLimitDefs: 0,
      });

      const response = await request(app)
        .get("/api/defs/latest")
        .set(createAuthHeader(RoleType.USER))
        .expect(200);

      expect(response.body.exists).toBe(true);
      expect(response.body.data.total).toBe(1);
    });
  });

  describe("GET /api/defs/calculation-status", () => {
    it("200 returns calculation status for USER", async () => {
      vi.mocked(getCalculationStatus).mockReturnValue({
        ...idleStatus,
        progress: 25,
        currentStep: "Processing",
      });

      const response = await request(app)
        .get("/api/defs/calculation-status")
        .set(createAuthHeader(RoleType.USER))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.progress).toBe(25);
    });
  });

  describe("POST /api/defs/calculate", () => {
    it("401 without auth token", async () => {
      await request(app).post("/api/defs/calculate").expect(401);
    });

    it("403 for USER role", async () => {
      await request(app)
        .post("/api/defs/calculate")
        .set(createAuthHeader(RoleType.USER))
        .expect(403);
    });

    it("409 when calculation already running", async () => {
      vi.mocked(getCalculationStatus).mockReturnValue({
        ...idleStatus,
        isRunning: true,
        progress: 10,
      });

      const response = await request(app)
        .post("/api/defs/calculate")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(409);

      expect(response.body.message).toBe("Розрахунок вже виконується");
      expect(calculateAndSavePogrebiDefsUtil).not.toHaveBeenCalled();
    });

    it("201 triggers calculation for ADMIN", async () => {
      vi.mocked(calculateAndSavePogrebiDefsUtil).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        result: {},
        total: 0,
        totalCriticalDefs: 0,
        totalLimitDefs: 0,
        createdAt: new Date("2024-01-15T10:00:00.000Z"),
        updatedAt: new Date("2024-01-15T10:00:00.000Z"),
      } as never);

      const response = await request(app)
        .post("/api/defs/calculate")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(calculateAndSavePogrebiDefsUtil).toHaveBeenCalledTimes(1);
    });
  });
});
