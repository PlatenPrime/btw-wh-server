import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import app from "../../../test/utils/testApp.js";
import { Sku } from "../../skus/models/Sku.js";
import { Skugr } from "../../skugrs/models/Skugr.js";
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

const productHtml = (stock: number, price: string) => `
<!DOCTYPE html>
<html>
  <body>
    <input id="max-product-quantity" value="${stock}" />
    <span class="us-price-actual">${price} грн.</span>
  </body>
</html>
`;

describe("Sku-slices air client ingestion integration", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
    await SkuSlice.deleteMany({});
  });

  describe("GET /api/sku-slices/client/air/pending", () => {
    it("401 without token", async () => {
      await request(app).get("/api/sku-slices/client/air/pending").expect(401);
    });

    it("403 for USER", async () => {
      await request(app)
        .get("/api/sku-slices/client/air/pending")
        .set(createAuthHeader(RoleType.USER))
        .expect(403);
    });

    it("200 returns pending sliced air skus for today", async () => {
      const pending = await Sku.create({
        konkName: "air",
        prodName: "p",
        productId: "air-pending",
        title: "Pending",
        url: "https://airballoons.com.ua/ua/product/pending",
      });
      const valid = await Sku.create({
        konkName: "air",
        prodName: "p",
        productId: "air-valid",
        title: "Valid",
        url: "https://airballoons.com.ua/ua/product/valid",
      });
      const unsliced = await Sku.create({
        konkName: "air",
        prodName: "p",
        productId: "air-unsliced",
        title: "Unliced",
        url: "https://airballoons.com.ua/ua/product/unsliced",
      });
      await Skugr.create({
        konkName: "air",
        prodName: "p",
        title: "g",
        url: "https://airballoons.com.ua/g",
        isSliced: true,
        skus: [pending._id, valid._id],
      });
      await Skugr.create({
        konkName: "air",
        prodName: "p2",
        title: "g2",
        url: "https://airballoons.com.ua/g2",
        isSliced: false,
        skus: [unsliced._id],
      });
      await SkuSlice.create({
        konkName: "air",
        date: toSliceDate(new Date()),
        data: {
          "air-valid": { stock: 5, price: 1.2 },
          "air-pending": { stock: -1, price: -1 },
        },
      });

      const response = await request(app)
        .get("/api/sku-slices/client/air/pending")
        .set(createAuthHeader())
        .expect(200);

      expect(response.body.data.date).toBe(
        toSliceDate(new Date()).toISOString()
      );
      expect(response.body.data.rotation).toBeNull();
      expect(response.body.data.items).toEqual([
        {
          skuId: pending._id.toString(),
          productId: "air-pending",
          title: "Pending",
          url: "https://airballoons.com.ua/ua/product/pending",
        },
      ]);
    });
  });

  describe("PUT /api/sku-slices/client/air/sku/:skuId", () => {
    it("400 on validation error", async () => {
      await request(app)
        .put("/api/sku-slices/client/air/sku/bad-id")
        .set(createAuthHeader())
        .send({ sourceUrl: "https://x.com", html: "<html></html>" })
        .expect(400);
    });

    it("404 when sku missing", async () => {
      await request(app)
        .put("/api/sku-slices/client/air/sku/507f1f77bcf86cd799439011")
        .set(createAuthHeader())
        .send({
          sourceUrl: "https://airballoons.com.ua/ua/product/x",
          html: productHtml(1, "2.10"),
        })
        .expect(404);
    });

    it("400 for URL mismatch", async () => {
      const sku = await Sku.create({
        konkName: "air",
        prodName: "p",
        productId: "air-url",
        title: "Url",
        url: "https://airballoons.com.ua/ua/product/url",
      });
      await Skugr.create({
        konkName: "air",
        prodName: "p",
        title: "g",
        url: "https://airballoons.com.ua/g",
        isSliced: true,
        skus: [sku._id],
      });

      const response = await request(app)
        .put(`/api/sku-slices/client/air/sku/${sku._id.toString()}`)
        .set(createAuthHeader())
        .send({
          sourceUrl: "https://airballoons.com.ua/ua/product/other",
          html: productHtml(1, "2.10"),
        })
        .expect(400);

      expect(response.body.code).toBe("URL_MISMATCH");
    });

    it("422 when html cannot be parsed", async () => {
      const sku = await Sku.create({
        konkName: "air",
        prodName: "p",
        productId: "air-bad-html",
        title: "Bad",
        url: "https://airballoons.com.ua/ua/product/bad",
      });
      await Skugr.create({
        konkName: "air",
        prodName: "p",
        title: "g",
        url: "https://airballoons.com.ua/g",
        isSliced: true,
        skus: [sku._id],
      });

      await request(app)
        .put(`/api/sku-slices/client/air/sku/${sku._id.toString()}`)
        .set(createAuthHeader())
        .send({
          sourceUrl: "https://airballoons.com.ua/ua/product/bad",
          html: "<html><body>protected</body></html>",
        })
        .expect(422);
    });

    it("200 saves and then skips overwrite of valid value", async () => {
      const sku = await Sku.create({
        konkName: "air",
        prodName: "p",
        productId: "air-save",
        title: "Save",
        url: "https://airballoons.com.ua/ua/product/save",
      });
      await Skugr.create({
        konkName: "air",
        prodName: "p",
        title: "g",
        url: "https://airballoons.com.ua/g",
        isSliced: true,
        skus: [sku._id],
      });

      const first = await request(app)
        .put(`/api/sku-slices/client/air/sku/${sku._id.toString()}`)
        .set(createAuthHeader())
        .send({
          sourceUrl: "https://airballoons.com.ua/ua/product/save",
          html: productHtml(10, "2.10"),
        })
        .expect(200);

      expect(first.body.data).toMatchObject({
        status: "saved",
        productId: "air-save",
        stock: 10,
        price: 2.1,
      });

      const second = await request(app)
        .put(`/api/sku-slices/client/air/sku/${sku._id.toString()}`)
        .set(createAuthHeader())
        .send({
          sourceUrl: "https://airballoons.com.ua/ua/product/save",
          html: productHtml(99, "9.99"),
        })
        .expect(200);

      expect(second.body.data).toMatchObject({
        status: "skipped",
        stock: 10,
        price: 2.1,
      });

      const doc = await SkuSlice.findOne({
        konkName: "air",
        date: toSliceDate(new Date()),
      }).lean();
      expect(doc?.data?.["air-save"]).toEqual({ stock: 10, price: 2.1 });
    });
  });
});
