import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../models/Prod.js";
import { createProdController } from "../create-prod/createProdController.js";

describe("createProdController", () => {
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

  it("400 when name missing", async () => {
    const req = {
      body: { title: "Title", imageUrl: "https://x.com/1.png" },
    } as unknown as Request;
    await createProdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("201 creates prod and returns data", async () => {
    const req = {
      body: {
        name: "acme",
        title: "Acme Corp",
        imageUrl: "https://example.com/acme.png",
      },
    } as unknown as Request;
    await createProdController(req, res);
    expect(responseStatus.code).toBe(201);
    expect((responseJson.data as { name: string }).name).toBe("acme");
    const count = await Prod.countDocuments();
    expect(count).toBe(1);
  });
});
