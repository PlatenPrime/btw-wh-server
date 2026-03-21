import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../skus/models/Sku.js";
import { Skugr } from "../../models/Skugr.js";
import { createSkugrController } from "../create-skugr/createSkugrController.js";

describe("createSkugrController", () => {
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

  it("400 on validation error", async () => {
    const req = { body: { title: "" } } as unknown as Request;
    await createSkugrController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("201 creates skugr", async () => {
    const req = {
      body: {
        konkName: "k1",
        prodName: "p1",
        title: "Group",
        url: "https://k1.com/g",
        skus: [],
      },
    } as unknown as Request;

    await createSkugrController(req, res);

    expect(responseStatus.code).toBe(201);
    expect((responseJson.data as { title: string }).title).toBe("Group");
  });

  it("400 when sku id invalid reference", async () => {
    const req = {
      body: {
        konkName: "k1",
        prodName: "p1",
        title: "Group",
        url: "https://k1.com/g2",
        skus: ["507f1f77bcf86cd799439011"],
      },
    } as unknown as Request;

    await createSkugrController(req, res);

    expect(responseStatus.code).toBe(400);
  });

  it("201 with valid sku ids", async () => {
    const sku = await Sku.create({
      konkName: "k1",
      prodName: "p1",
      title: "S",
      url: "https://k1.com/s-only",
    });

    const req = {
      body: {
        konkName: "k1",
        prodName: "p1",
        title: "Group",
        url: "https://k1.com/g3",
        skus: [sku._id.toString()],
      },
    } as unknown as Request;

    await createSkugrController(req, res);

    expect(responseStatus.code).toBe(201);
    const data = responseJson.data as { skus: string[] };
    expect(data.skus).toEqual([sku._id.toString()]);
  });
});
