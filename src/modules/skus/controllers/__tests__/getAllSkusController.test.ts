import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../models/Sku.js";
import { getAllSkusController } from "../get-all-skus/getAllSkusController.js";

describe("getAllSkusController", () => {
  let res: Response;
  let responseJson: Record<string, any>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Sku.deleteMany({});
    responseJson = {};
    responseStatus = {};
    res = {
      status(code: number) {
        responseStatus.code = code;
        return this;
      },
      json(data: unknown) {
        responseJson = data as Record<string, any>;
        return this;
      },
      headersSent: false,
    } as unknown as Response;
  });

  it("400 for invalid query params", async () => {
    const req = { query: { page: "0", limit: "10" } } as unknown as Request;
    await getAllSkusController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("200 returns filtered and paginated data", async () => {
    await Sku.create({
      konkName: "k1",
      prodName: "p1",
      title: "Wanted",
      url: "https://k1.com/wanted",
    });
    await Sku.create({
      konkName: "k2",
      prodName: "p2",
      title: "Other",
      url: "https://k2.com/other",
    });

    const req = {
      query: { page: "1", limit: "10", konkName: "k1", prodName: "p1" },
    } as unknown as Request;

    await getAllSkusController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
    expect(responseJson.pagination.total).toBe(1);
  });
});
