import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../models/Konk.js";
import { getKonkByIdController } from "../get-konk-by-id/getKonkByIdController.js";

describe("getKonkByIdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Konk.deleteMany({});
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
    await getKonkByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when konk not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
    } as unknown as Request;
    await getKonkByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 returns konk data", async () => {
    const konk = await Konk.create({
      name: "acme",
      title: "Acme",
      url: "https://acme.com",
      imageUrl: "https://acme.com/1.png",
    });
    const req = { params: { id: konk._id.toString() } } as unknown as Request;
    await getKonkByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as { name: string }).name).toBe("acme");
  });
});
