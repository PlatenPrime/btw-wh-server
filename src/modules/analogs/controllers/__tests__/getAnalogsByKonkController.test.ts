import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../models/Analog.js";
import { getAnalogsByKonkController } from "../get-analogs-by-konk/getAnalogsByKonkController.js";

describe("getAnalogsByKonkController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Analog.deleteMany({});
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

  it("400 when konkName empty", async () => {
    const req = { params: { konkName: "" } } as unknown as Request;
    await getAnalogsByKonkController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("200 returns analogs for konkName", async () => {
    await Analog.create([
      { konkName: "acme", prodName: "p1", url: "https://a.com" },
      { konkName: "acme", prodName: "p2", url: "https://b.com" },
    ]);
    const req = { params: { konkName: "acme" } } as unknown as Request;
    await getAnalogsByKonkController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as unknown[]).length).toBe(2);
  });
});
