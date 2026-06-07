import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { Skugr } from "../../skugrs/models/Skugr.js";
import { Sku } from "../models/Sku.js";

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

describe("Skus router integration", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
  });

  describe("GET /api/skus", () => {
    it("401 without auth token", async () => {
      await request(app).get("/api/skus").expect(401);
    });

    it("200 returns skus for ADMIN", async () => {
      await Sku.create({
        konkName: "k1",
        prodName: "p1",
        productId: "k1-list",
        title: "Listed",
        url: "https://k1.com/list",
      });

      const response = await request(app)
        .get("/api/skus")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });
  });

  describe("POST /api/skus", () => {
    it("201 creates sku", async () => {
      const response = await request(app)
        .post("/api/skus")
        .set(createAuthHeader(RoleType.ADMIN))
        .send({
          konkName: "k1",
          prodName: "p1",
          productId: "k1-new",
          title: "New SKU",
          url: "https://k1.com/new",
        })
        .expect(201);

      expect(response.body.data.title).toBe("New SKU");
    });
  });

  describe("GET /api/skus/id/:id", () => {
    it("404 when sku not found", async () => {
      await request(app)
        .get("/api/skus/id/000000000000000000000000")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(404);
    });
  });

  describe("POST /api/skus/fix-incorrect-sku-data", () => {
    it("200 fixes sku by filter", async () => {
      await Sku.create({
        konkName: "k-fix",
        prodName: "p1",
        productId: "k-fix-int",
        title: "Before",
        url: "https://k-fix.com/int",
      });

      const response = await request(app)
        .post("/api/skus/fix-incorrect-sku-data")
        .set(createAuthHeader(RoleType.ADMIN))
        .send({
          filter: { konkName: "k-fix" },
          updates: { title: "After integration" },
        })
        .expect(200);

      expect(response.body.data.modifiedCount).toBe(1);
    });
  });

  describe("DELETE /api/skus/id/:id", () => {
    it("403 for ADMIN role", async () => {
      const sku = await Sku.create({
        konkName: "k1",
        prodName: "p1",
        productId: "k1-del",
        title: "Delete me",
        url: "https://k1.com/del",
      });

      await request(app)
        .delete(`/api/skus/id/${sku._id.toString()}`)
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(403);
    });

    it("200 deletes sku for PRIME", async () => {
      const sku = await Sku.create({
        konkName: "k1",
        prodName: "p1",
        productId: "k1-del-prime",
        title: "Delete prime",
        url: "https://k1.com/del-prime",
      });

      const response = await request(app)
        .delete(`/api/skus/id/${sku._id.toString()}`)
        .set(createAuthHeader(RoleType.PRIME))
        .expect(200);

      expect(response.body.message).toBe("Sku deleted successfully");
      expect(await Sku.countDocuments()).toBe(0);
    });
  });

  describe("DELETE /api/skus/konk/:konkName/invalid", () => {
    it("200 deletes invalid skus for PRIME", async () => {
      await Sku.create({
        konkName: "air",
        prodName: "p",
        productId: "air-inv",
        title: "Invalid",
        url: "https://ex.com/inv",
        isInvalid: true,
      });

      const response = await request(app)
        .delete("/api/skus/konk/air/invalid")
        .set(createAuthHeader(RoleType.PRIME))
        .expect(200);

      expect(response.body.deletedCount).toBe(1);
    });
  });
});
