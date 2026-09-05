import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { Skugr } from "../models/Skugr.js";
import { Sku } from "../../skus/models/Sku.js";

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

describe("Skugrs router integration", () => {
  beforeEach(async () => {
    await Skugr.deleteMany({});
    await Sku.deleteMany({});
  });

  describe("GET /api/skugrs", () => {
    it("401 without auth token", async () => {
      await request(app).get("/api/skugrs").expect(401);
    });

    it("200 returns skugrs for ADMIN", async () => {
      await Skugr.create({
        konkName: "k1",
        prodName: "p1",
        title: "Group A",
        url: "https://k1.com/a",
        skus: [],
      });

      const response = await request(app)
        .get("/api/skugrs")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });
  });

  describe("POST /api/skugrs", () => {
    it("201 creates skugr", async () => {
      const response = await request(app)
        .post("/api/skugrs")
        .set(createAuthHeader(RoleType.ADMIN))
        .send({
          konkName: "k1",
          prodName: "p1",
          title: "New group",
          url: "https://k1.com/new",
          skus: [],
        })
        .expect(201);

      expect(response.body.data.title).toBe("New group");
    });
  });

  describe("GET /api/skugrs/id/:id", () => {
    it("404 when skugr not found", async () => {
      await request(app)
        .get("/api/skugrs/id/000000000000000000000000")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(404);
    });

    it("200 returns skugr metadata without skus", async () => {
      const skugr = await Skugr.create({
        konkName: "k1",
        prodName: "p1",
        title: "By id",
        url: "https://k1.com/by-id",
        skus: [],
      });

      const response = await request(app)
        .get(`/api/skugrs/id/${skugr._id.toString()}`)
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(200);

      expect(response.body.data.title).toBe("By id");
      expect(response.body.data).not.toHaveProperty("skus");
    });
  });

  describe("DELETE /api/skugrs/id/:id", () => {
    it("403 for ADMIN role", async () => {
      const skugr = await Skugr.create({
        konkName: "k1",
        prodName: "p1",
        title: "Delete",
        url: "https://k1.com/del",
        skus: [],
      });

      await request(app)
        .delete(`/api/skugrs/id/${skugr._id.toString()}`)
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(403);
    });

    it("200 deletes skugr for PRIME", async () => {
      const skugr = await Skugr.create({
        konkName: "k1",
        prodName: "p1",
        title: "Delete prime",
        url: "https://k1.com/del-prime",
        skus: [],
      });

      const response = await request(app)
        .delete(`/api/skugrs/id/${skugr._id.toString()}`)
        .set(createAuthHeader(RoleType.PRIME))
        .expect(200);

      expect(response.body.message).toBe("Skugr deleted successfully");
      expect(await Skugr.countDocuments()).toBe(0);
    });
  });

  describe("GET /api/skugrs/client/air/pending", () => {
    it("401 without token", async () => {
      await request(app).get("/api/skugrs/client/air/pending").expect(401);
    });

    it("403 for USER", async () => {
      await request(app)
        .get("/api/skugrs/client/air/pending")
        .set(createAuthHeader(RoleType.USER))
        .expect(403);
    });

    it("200 returns air groups", async () => {
      const air = await Skugr.create({
        konkName: "air",
        prodName: "p",
        title: "Air G",
        url: "https://airballoons.com.ua/g",
        skus: [],
      });
      await Skugr.create({
        konkName: "balun",
        prodName: "p",
        title: "Other",
        url: "https://balun.example/g",
        skus: [],
      });

      const response = await request(app)
        .get("/api/skugrs/client/air/pending")
        .set(createAuthHeader())
        .expect(200);

      expect(response.body.data.items).toEqual([
        {
          skugrId: air._id.toString(),
          title: "Air G",
          url: "https://airballoons.com.ua/g",
          prodName: "p",
        },
      ]);
    });
  });

  describe("POST /api/skugrs/client/air/id/:id/fill-page", () => {
    const groupUrl =
      "https://airballoons.com.ua/ua/index.php?route=product/category&path=1";

    it("400 on validation error", async () => {
      await request(app)
        .post("/api/skugrs/client/air/id/bad-id/fill-page")
        .set(createAuthHeader())
        .send({ sourceUrl: groupUrl, pageUrl: groupUrl, html: "<html></html>" })
        .expect(400);
    });

    it("404 when skugr missing", async () => {
      await request(app)
        .post(
          "/api/skugrs/client/air/id/507f1f77bcf86cd799439011/fill-page"
        )
        .set(createAuthHeader())
        .send({
          sourceUrl: groupUrl,
          pageUrl: groupUrl,
          html: "<html></html>",
        })
        .expect(404);
    });

    it("200 fills page and creates sku", async () => {
      const skugr = await Skugr.create({
        konkName: "air",
        prodName: "acme",
        title: "A",
        url: groupUrl,
        skus: [],
      });
      const html = `<!DOCTYPE html><html><head></head><body>
        <div class="row us-category-products">
          <div class="product-layout" data-pid="333">
            <div class="us-module-img">
              <a href="/ua/product/p333">
                <img src="https://airballoons.com.ua/img/c.jpg" alt="" />
              </a>
            </div>
            <div class="us-module-title">
              <a href="/ua/product/p333">Three</a>
            </div>
          </div>
        </div>
      </body></html>`;

      const response = await request(app)
        .post(`/api/skugrs/client/air/id/${skugr._id.toString()}/fill-page`)
        .set(createAuthHeader())
        .send({ sourceUrl: groupUrl, pageUrl: groupUrl, html })
        .expect(200);

      expect(response.body.data.productsOnPage).toBe(1);
      expect(response.body.data.stats.created).toBe(1);
      expect(await Sku.countDocuments({ productId: "air-333" })).toBe(1);
    });
  });

  describe("POST /api/skugrs/id/:id/fill-skus air idle", () => {
    it("400 CLIENT_INGEST_REQUIRED for air", async () => {
      const skugr = await Skugr.create({
        konkName: "air",
        prodName: "p",
        title: "Air",
        url: "https://airballoons.com.ua/g",
        skus: [],
      });

      const response = await request(app)
        .post(`/api/skugrs/id/${skugr._id.toString()}/fill-skus`)
        .set(createAuthHeader())
        .send({})
        .expect(400);

      expect(response.body.code).toBe("CLIENT_INGEST_REQUIRED");
    });
  });
});
