import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../models/Sku.js";
import { createSkuController } from "../create-sku/createSkuController.js";

describe("createSkuController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
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
        responseJson = data as Record<string, unknown>;
        return this;
      },
      headersSent: false,
    } as unknown as Response;
  });

  it("400 when required fields are missing", async () => {
    const req = { body: { konkName: "k1" } } as unknown as Request;
    await createSkuController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("201 creates sku and returns data", async () => {
    const req = {
      body: {
        konkName: "k1",
        prodName: "p1",
        title: "Sku 1",
        url: "https://k1.com/sku-1",
      },
    } as unknown as Request;

    await createSkuController(req, res);

    expect(responseStatus.code).toBe(201);
    expect((responseJson.data as { title: string }).title).toBe("Sku 1");
    expect(await Sku.countDocuments()).toBe(1);
  });
});
