import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { ApiTask } from "../../apitasks/models/ApiTask.js";
import { Sku } from "../../skus/models/Sku.js";
import { seedSkuSliceMonthDay } from "../utils/seedSkuSliceMonthDay.js";
import { SkuSliceMonth } from "../models/SkuSliceMonth.js";

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
    await SkuSliceMonth.deleteMany({});
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

    it("PATCH /api/sku-slices/sku/:skuId returns 401 without token", async () => {
      await request(app)
        .patch("/api/sku-slices/sku/507f1f77bcf86cd799439011")
        .send({ date: "2026-09-20", stock: 3, price: 110 })
        .expect(401);
    });

    it("PATCH /api/sku-slices/sku/:skuId returns 403 for USER role", async () => {
      await request(app)
        .patch("/api/sku-slices/sku/507f1f77bcf86cd799439011")
        .set(createAuthHeader(RoleType.USER))
        .send({ date: "2026-09-20", stock: 3, price: 110 })
        .expect(403);
    });

    it("POST /api/sku-slices/skugr/:skugrId/run-today returns 401 without token", async () => {
      await request(app)
        .post("/api/sku-slices/skugr/507f1f77bcf86cd799439011/run-today")
        .expect(401);
    });

    it("POST /api/sku-slices/skugr/:skugrId/run-today returns 403 for USER role", async () => {
      await request(app)
        .post("/api/sku-slices/skugr/507f1f77bcf86cd799439011/run-today")
        .set(createAuthHeader(RoleType.USER))
        .expect(403);
    });
  });

  describe("GET /api/sku-slices", () => {
    it("410 gone with migration pointers", async () => {
      const response = await request(app)
        .get("/api/sku-slices")
        .set(createAuthHeader())
        .query({ konkName: "air", date: "2026-06-01" })
        .expect(410);

      expect(response.body.errors?.[0]?.code).toBe("SKU_SLICE_DAY_LIST_GONE");
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
      await seedSkuSliceMonthDay("perfect", new Date("2026-09-13T00:00:00.000Z"), { "perfect-1": { stock: 100, price: 100 } });
      await seedSkuSliceMonthDay("perfect", new Date("2026-09-14T00:00:00.000Z"), { "perfect-1": { stock: 10000, price: 1 } });
      await seedSkuSliceMonthDay("perfect", new Date("2026-09-15T00:00:00.000Z"), { "perfect-1": { stock: 100, price: 100 } });

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
      await seedSkuSliceMonthDay("r-k", new Date("2026-06-02T00:00:00.000Z"), { "r-k-1": { stock: 4, price: 6 } });

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

  describe("PATCH /api/sku-slices/sku/:skuId", () => {
    it("400 for invalid body", async () => {
      const response = await request(app)
        .patch("/api/sku-slices/sku/507f1f77bcf86cd799439011")
        .set(createAuthHeader())
        .send({ date: "2026-09-20", stock: "3", price: 110 })
        .expect(400);

      expect(response.body.message).toBe("Validation error");
    });

    it("200 creates slice document when missing", async () => {
      const sku = await Sku.create({
        konkName: "r-k",
        prodName: "p",
        productId: "r-k-missing",
        title: "One",
        url: "https://e.com/1",
      });

      const response = await request(app)
        .patch(`/api/sku-slices/sku/${sku._id.toString()}`)
        .set(createAuthHeader())
        .send({ date: "2026-09-20", stock: 3, price: 110 })
        .expect(200);

      expect(response.body.data).toMatchObject({
        productId: "r-k-missing",
        stock: 3,
        price: 110,
        previous: null,
        created: true,
      });
    });

    it("200 updates slice point for ADMIN", async () => {
      const sku = await Sku.create({
        konkName: "r-k",
        prodName: "p",
        productId: "r-k-patch",
        title: "One",
        url: "https://e.com/1",
      });
      await seedSkuSliceMonthDay("r-k", new Date("2026-09-20T00:00:00.000Z"), { "r-k-patch": { stock: 60, price: 5.5 } });

      const response = await request(app)
        .patch(`/api/sku-slices/sku/${sku._id.toString()}`)
        .set(createAuthHeader())
        .send({ date: "2026-09-20", stock: 3, price: 110 })
        .expect(200);

      expect(response.body.message).toBe(
        "Sku slice by date updated successfully"
      );
      expect(response.body.data).toMatchObject({
        productId: "r-k-patch",
        stock: 3,
        price: 110,
        previous: { stock: 60, price: 5.5 },
        created: false,
      });
    });

    it("200 updates date range for ADMIN", async () => {
      const sku = await Sku.create({
        konkName: "r-k",
        prodName: "p",
        productId: "r-k-range",
        title: "One",
        url: "https://e.com/1",
      });

      const response = await request(app)
        .patch(`/api/sku-slices/sku/${sku._id.toString()}`)
        .set(createAuthHeader())
        .send({
          dateFrom: "2026-09-20",
          dateTo: "2026-09-21",
          stock: 3,
          price: 110,
        })
        .expect(200);

      expect(response.body.message).toBe(
        "Sku slice by date range updated successfully"
      );
      expect(response.body.data.updatedCount).toBe(2);
      expect(response.body.data.days).toHaveLength(2);
    });

    it("200 updates date periods for ADMIN", async () => {
      const sku = await Sku.create({
        konkName: "r-k",
        prodName: "p",
        productId: "r-k-periods",
        title: "One",
        url: "https://e.com/1",
      });

      const response = await request(app)
        .patch(`/api/sku-slices/sku/${sku._id.toString()}`)
        .set(createAuthHeader())
        .send({
          periods: [
            { dateFrom: "2026-09-20", dateTo: "2026-09-21" },
            { dateFrom: "2026-09-25", dateTo: "2026-09-25" },
          ],
          stock: 3,
          price: 110,
        })
        .expect(200);

      expect(response.body.message).toBe(
        "Sku slice by date periods updated successfully"
      );
      expect(response.body.data.updatedCount).toBe(3);
      expect(response.body.data.days).toHaveLength(3);
      expect(response.body.data.periods).toHaveLength(2);
    });
  });

  describe("POST /api/sku-slices/skugr/:skugrId/run-today", () => {
    it("410 migrated to apitasks", async () => {
      const response = await request(app)
        .post("/api/sku-slices/skugr/507f1f77bcf86cd799439011/run-today")
        .set(createAuthHeader())
        .expect(410);

      expect(response.body.code).toBe("API_TASKS_MIGRATED");
      expect(response.body.kind).toBe("sku-slices.skugr-run-today");
    });
  });

  describe("POST /api/sku-slices/post-corrections/run", () => {
    beforeEach(async () => {
      await ApiTask.deleteMany({});
    });

    it("401 without token", async () => {
      await request(app)
        .post("/api/sku-slices/post-corrections/run")
        .send({ dateFrom: "2026-04-01", dateTo: "2026-04-03" })
        .expect(401);
    });

    it("202 enqueues apitask for ADMIN", async () => {
      const response = await request(app)
        .post("/api/sku-slices/post-corrections/run")
        .set(createAuthHeader())
        .send({
          dateFrom: "2026-04-01",
          dateTo: "2026-04-03",
          apply: false,
        })
        .expect(202);

      expect(response.body.message).toBe("Api task accepted");
      expect(response.body.data.kind).toBe("sku-slices.post-corrections.run");
      expect(response.body.data.taskId).toBeTruthy();

      const task = await ApiTask.findById(response.body.data.taskId).lean();
      expect(task?.kind).toBe("sku-slices.post-corrections.run");
      expect(task?.params).toMatchObject({
        apply: false,
      });
    });
  });
});
