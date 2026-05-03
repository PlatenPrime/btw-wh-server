import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { Skugr } from "../../../models/Skugr.js";
import { deleteSkugrWithSkusController } from "../deleteSkugrWithSkusController.js";

describe("deleteSkugrWithSkusController", () => {
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

  it("404 when missing", async () => {
    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
    } as unknown as Request;
    await deleteSkugrWithSkusController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 deletes skugr and skus", async () => {
    const sku = await Sku.create({
      konkName: "kdw",
      prodName: "pdw",
      productId: "kdw-1",
      title: "S",
      url: "https://kdw.com/1",
    });
    const g = await Skugr.create({
      konkName: "kdw",
      prodName: "pdw",
      title: "G",
      url: "https://kdw.com/g",
      skus: [sku._id],
    });

    const req = { params: { id: g._id.toString() } } as unknown as Request;
    await deleteSkugrWithSkusController(req, res);

    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as { deletedSkusCount: number }).deletedSkusCount).toBe(
      1,
    );
    expect(await Skugr.findById(g._id)).toBeNull();
    expect(await Sku.findById(sku._id)).toBeNull();
  });
});
