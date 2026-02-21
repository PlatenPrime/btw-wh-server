import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../models/Prod.js";
import { getProdByNameController } from "../get-prod-by-name/getProdByNameController.js";

describe("getProdByNameController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
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

  it("404 when prod not found", async () => {
    const req = { params: { name: "nonexistent" } } as unknown as Request;
    await getProdByNameController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 returns prod data", async () => {
    await Prod.create({
      name: "acme",
      title: "Acme",
      imageUrl: "https://acme.com/1.png",
    });
    const req = { params: { name: "acme" } } as unknown as Request;
    await getProdByNameController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as { name: string }).name).toBe("acme");
  });
});
