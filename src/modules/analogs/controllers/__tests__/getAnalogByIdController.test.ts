import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../konks/models/Konk.js";
import { Prod } from "../../../prods/models/Prod.js";
import { Analog } from "../../models/Analog.js";
import { getAnalogByIdController } from "../get-analog-by-id/getAnalogByIdController.js";

describe("getAnalogByIdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Analog.deleteMany({});
    await Konk.deleteMany({});
    await Prod.deleteMany({});
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

  it("400 when id invalid", async () => {
    const req = { params: { id: "invalid" } } as unknown as Request;
    await getAnalogByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when analog not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
    } as unknown as Request;
    await getAnalogByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 returns analog with konk and prod", async () => {
    await Konk.create({
      name: "acme",
      title: "Acme",
      url: "https://acme.com",
      imageUrl: "https://acme.com/1.png",
    });
    await Prod.create({
      name: "maker",
      title: "Maker",
      imageUrl: "https://maker.com/1.png",
    });
    const analog = await Analog.create({
      konkName: "acme",
      prodName: "maker",
      url: "https://example.com/p",
    });
    const req = { params: { id: analog._id.toString() } } as unknown as Request;
    await getAnalogByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    const data = responseJson.data as { konk: { name: string }; prod: { name: string } };
    expect(data.konk.name).toBe("acme");
    expect(data.prod.name).toBe("maker");
  });
});
