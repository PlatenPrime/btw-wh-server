import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../skus/models/Sku.js";
import { Skugr } from "../../models/Skugr.js";
import { getSkugrByIdController } from "../get-skugr-by-id/getSkugrByIdController.js";

describe("getSkugrByIdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Skugr.deleteMany({});
    await Sku.deleteMany({});
    responseJson = {};
    responseStatus = {};
    res = {
      status(code: number) {
        responseStatus.code = code;
        return this;
      },
      json(data: unknown) {
        responseJson = data as Record<string, unknown>;
        return this;
      },
      headersSent: false,
    } as unknown as Response;
  });

  it("400 on invalid id", async () => {
    const req = { params: { id: "not-an-objectid" } } as unknown as Request;
    await getSkugrByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when skugr not found", async () => {
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
    } as unknown as Request;
    await getSkugrByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 with metadata only, no skus field", async () => {
    const skugr = await Skugr.create({
      konkName: "k1",
      prodName: "p1",
      title: "G",
      url: "https://k1.com/g-empty",
      skus: [],
    });

    const req = {
      params: { id: skugr._id.toString() },
    } as unknown as Request;

    await getSkugrByIdController(req, res);

    expect(responseStatus.code).toBe(200);
    const data = responseJson.data as Record<string, unknown>;
    expect(data.title).toBe("G");
    expect(data).not.toHaveProperty("skus");
  });

  it("200 omits skus even when group references sku ids", async () => {
    const sku = await Sku.create({
      konkName: "k1",
      prodName: "p1",
      productId: "k1-skugr-get-one",
      title: "S",
      url: "https://k1.com/s-one",
    });
    const skugr = await Skugr.create({
      konkName: "k1",
      prodName: "p1",
      title: "WithRefs",
      url: "https://k1.com/g-refs",
      skus: [sku._id],
    });

    const req = {
      params: { id: skugr._id.toString() },
    } as unknown as Request;

    await getSkugrByIdController(req, res);

    expect(responseStatus.code).toBe(200);
    const data = responseJson.data as Record<string, unknown>;
    expect(data.title).toBe("WithRefs");
    expect(data).not.toHaveProperty("skus");
  });
});
