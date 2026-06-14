import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { BtradeSlice } from "../models/BtradeSlice.js";

const createAuthHeader = (role: RoleType = RoleType.ADMIN) => {
  const secret =
    process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
  const token = jwt.sign(
    { id: new mongoose.Types.ObjectId().toString(), role },
    secret,
    { expiresIn: "1h" },
  );
  return { Authorization: `Bearer ${token}` };
};

describe("Btrade slices router integration", () => {
  describe("GET /api/btrade-slices", () => {
    it("401 without auth token", async () => {
      await request(app)
        .get("/api/btrade-slices")
        .query({ date: "2025-03-01" })
        .expect(401);
    });

    it("403 for USER role", async () => {
      await request(app)
        .get("/api/btrade-slices")
        .set(createAuthHeader(RoleType.USER))
        .query({ date: "2025-03-01" })
        .expect(403);
    });

    it("400 for invalid date format", async () => {
      await request(app)
        .get("/api/btrade-slices")
        .set(createAuthHeader(RoleType.ADMIN))
        .query({ date: "01-03-2025" })
        .expect(400);
    });

    it("404 when slice not found", async () => {
      const response = await request(app)
        .get("/api/btrade-slices")
        .set(createAuthHeader(RoleType.ADMIN))
        .query({ date: "2025-03-01" })
        .expect(404);

      expect(response.body.message).toBe("Btrade slice not found");
    });

    it("200 returns slice for ADMIN", async () => {
      const date = new Date("2025-03-01T00:00:00.000Z");
      await BtradeSlice.create({
        date,
        data: { "ART-1": { price: 100, quantity: 5 } },
      });

      const response = await request(app)
        .get("/api/btrade-slices")
        .set(createAuthHeader(RoleType.ADMIN))
        .query({ date: "2025-03-01" })
        .expect(200);

      expect(response.body.message).toBe("Btrade slice retrieved successfully");
      expect(response.body.data.items).toEqual([
        {
          artikul: "ART-1",
          quantity: 5,
          price: 100,
          art: null,
        },
      ]);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });
  });

  describe("GET /api/btrade-slices/artikul/:artikul/range", () => {
    it("200 returns raw range for artikul", async () => {
      const { Art } = await import("../../arts/models/Art.js");
      await Art.create({ artikul: "ART-RNG", zone: "A" });
      const d1 = new Date("2026-03-01T00:00:00.000Z");
      await BtradeSlice.create({
        date: d1,
        data: { "ART-RNG": { quantity: 4, price: 99 } },
      });

      const response = await request(app)
        .get("/api/btrade-slices/artikul/ART-RNG/range")
        .set(createAuthHeader(RoleType.ADMIN))
        .query({ dateFrom: "2026-03-01", dateTo: "2026-03-01" })
        .expect(200);

      expect(response.body.data).toEqual([
        { date: d1.toISOString(), quantity: 4, price: 99 },
      ]);
    });
  });
});
