import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { Sku } from "../../../models/Sku.js";
import { deleteSkusNotInAnySkugrController } from "../deleteSkusNotInAnySkugrController.js";

describe("deleteSkusNotInAnySkugrController", () => {
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

  it("400 on invalid query", async () => {
    const req = { query: { isInvalid: "maybe" } } as unknown as Request;
    await deleteSkusNotInAnySkugrController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("200 returns deletedCount", async () => {
    await Sku.create({
      konkName: "kdn",
      prodName: "pdn",
      productId: "kdn-1",
      title: "O",
      url: "https://kdn.com/1",
    });

    const req = { query: {} } as unknown as Request;
    await deleteSkusNotInAnySkugrController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.deletedCount).toBe(1);
  });
});
