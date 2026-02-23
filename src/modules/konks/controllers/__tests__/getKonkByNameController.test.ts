import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../models/Konk.js";
import { getKonkByNameController } from "../get-konk-by-name/getKonkByNameController.js";

describe("getKonkByNameController", () => {
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

  it("404 when konk not found", async () => {
    const req = { params: { name: "nonexistent" } } as unknown as Request;
    await getKonkByNameController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 returns konk data", async () => {
    await Konk.create({
      name: "acme",
      title: "Acme",
      url: "https://acme.com",
      imageUrl: "https://acme.com/1.png",
    });
    const req = { params: { name: "acme" } } as unknown as Request;
    await getKonkByNameController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as { name: string }).name).toBe("acme");
  });
});
