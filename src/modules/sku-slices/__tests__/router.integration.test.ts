import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { Sku } from "../../skus/models/Sku.js";
import { SkuSlice } from "../models/SkuSlice.js";

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

describe("Sku-slices router integration", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await SkuSlice.deleteMany({});
  });

  describe("auth guards", () => {
    it("GET /api/sku-slices returns 401 without token", async () => {
      await request(app)
        .get("/api/sku-slices")
        .query({ konkName: "air", date: "2026-06-01" })
        .expect(401);
    });

    it("GET /api/sku-slices/pack-flips returns 401 without token", async () => {
      await request(app)
        .get("/api/sku-slices/pack-flips")
        .query({
          konkName: "perfect",
          dateFrom: "2026-09-01",
          dateTo: "2026-09-15",
        })
        .expect(401);
    });

    it("GET /api/sku-slices returns 403 for USER role", async () => {
      await request(app)
        .get("/api/sku-slices")
        .set(createAuthHeader(RoleType.USER))
        .query({ konkName: "air", date: "2026-06-01" })
        .expect(403);
    });
  });

  describe("GET /api/sku-slices", () => {
    it("400 when query validation fails", async () => {
      const response = await request(app)
        .get("/api/sku-slices")
        .set(createAuthHeader())
        .query({ date: "2026-06-01" })
        .expect(400);

      expect(response.body.message).toBe("Validation error");
    });

    it("200 returns slice list for ADMIN", async () => {
      const konk = "router-k";
      const date = new Date("2026-06-01T00:00:00.000Z");
      await Sku.create({
        konkName: konk,
        prodName: "p",
        productId: `${konk}-1`,
        title: "Item",
        url: "https://e.com/i",
      });
      await SkuSlice.create({
        konkName: konk,
        date,
        data: { [`${konk}-1`]: { stock: 2, price: 5 } },
      });

      const response = await request(app)
        .get("/api/sku-slices")
        .set(createAuthHeader())
        .query({ konkName: konk, date: "2026-06-01" })
        .expect(200);

      expect(response.body.message).toBe("Sku slice retrieved successfully");
      expect(response.body.data.konkName).toBe(konk);
      expect(response.body.data.items.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/sku-slices/pack-flips", () => {
    it("400 when query validation fails", async () => {
      const response = await request(app)
        .get("/api/sku-slices/pack-flips")
        .set(createAuthHeader())
        .query({ konkName: "perfect", dateFrom: "2026-09-15", dateTo: "2026-09-01" })
        .expect(400);

      expect(response.body.message).toBe("Validation error");
    });

    it("200 returns dry-run findings for ADMIN", async () => {
      await Sku.create({
        konkName: "perfect",
        prodName: "gemar",
        productId: "perfect-1",
        title: "Balloon",
        url: "https://perfect.example/1",
      });
      await SkuSlice.create({
        konkName: "perfect",
        date: new Date("2026-09-13T00:00:00.000Z"),
        data: { "perfect-1": { stock: 100, price: 100 } },
      });
      await SkuSlice.create({
        konkName: "perfect",
        date: new Date("2026-09-14T00:00:00.000Z"),
        data: { "perfect-1": { stock: 10000, price: 1 } },
      });
      await SkuSlice.create({
        konkName: "perfect",
        date: new Date("2026-09-15T00:00:00.000Z"),
        data: { "perfect-1": { stock: 100, price: 100 } },
      });

      const response = await request(app)
        .get("/api/sku-slices/pack-flips")
        .set(createAuthHeader())
        .query({
          konkName: "perfect",
          dateFrom: "2026-09-13",
          dateTo: "2026-09-15",
        })
        .expect(200);

      expect(response.body.message).toBe(
        "Pack-flip review retrieved successfully"
      );
      expect(response.body.data.apply).toBeUndefined();
      expect(response.body.data.patched).toHaveLength(1);
      expect(response.body.data.patched[0].productId).toBe("perfect-1");
    });
  });

  describe("GET /api/sku-slices/sku/:skuId", () => {
    it("400 for invalid skuId", async () => {
      await request(app)
        .get("/api/sku-slices/sku/bad-id")
        .set(createAuthHeader())
        .query({ date: "2026-06-01" })
        .expect(400);
    });

    it("200 returns slice by sku and date", async () => {
      const sku = await Sku.create({
        konkName: "r-k",
        prodName: "p",
        productId: "r-k-1",
        title: "One",
        url: "https://e.com/1",
      });
      await SkuSlice.create({
        konkName: "r-k",
        date: new Date("2026-06-02T00:00:00.000Z"),
        data: { "r-k-1": { stock: 4, price: 6 } },
      });

      const response = await request(app)
        .get(`/api/sku-slices/sku/${sku._id.toString()}`)
        .set(createAuthHeader())
        .query({ date: "2026-06-02" })
        .expect(200);

      const data = response.body.data as { stock: number; price: number };
      expect(data.stock).toBe(4);
      expect(data.price).toBe(6);
    });
  });
});
