import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../skugrs/models/Skugr.js";
import { Sku } from "../../models/Sku.js";
import { getSkuByIdController } from "../get-sku-by-id/getSkuByIdController.js";

describe("getSkuByIdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
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

  it("400 for invalid id", async () => {
    const req = { params: { id: "bad-id" } } as unknown as Request;
    await getSkuByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when sku not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
    } as unknown as Request;
    await getSkuByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 includes skugrs for groups containing sku", async () => {
    const sku = await Sku.create({
      konkName: "k1",
      prodName: "p1",
      productId: "k1-1",
      title: "T",
      url: "https://k1.com/u",
    });
    await Skugr.create({
      konkName: "k1",
      prodName: "p1",
      title: "G",
      url: "https://k1.com/g",
      skus: [sku._id],
    });

    const req = { params: { id: sku._id.toString() } } as unknown as Request;
    await getSkuByIdController(req, res);

    expect(responseStatus.code).toBe(200);
    const data = responseJson.data as {
      skugrs: Array<{ title: string }>;
    };
    expect(data.skugrs).toHaveLength(1);
    expect(data.skugrs[0]!.title).toBe("G");
  });
});
