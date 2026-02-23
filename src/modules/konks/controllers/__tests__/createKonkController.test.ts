import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../models/Konk.js";
import { createKonkController } from "../create-konk/createKonkController.js";

describe("createKonkController", () => {
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

  it("400 when name missing", async () => {
    const req = {
      body: {
        title: "Title",
        url: "https://x.com",
        imageUrl: "https://x.com/1.png",
      },
    } as unknown as Request;
    await createKonkController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("400 when name contains spaces", async () => {
    const req = {
      body: {
        name: "acme corp",
        title: "Acme Corp",
        url: "https://example.com",
        imageUrl: "https://example.com/acme.png",
      },
    } as unknown as Request;
    await createKonkController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("201 creates konk and returns data", async () => {
    const req = {
      body: {
        name: "acme",
        title: "Acme Corp",
        url: "https://example.com",
        imageUrl: "https://example.com/acme.png",
      },
    } as unknown as Request;
    await createKonkController(req, res);
    expect(responseStatus.code).toBe(201);
    expect((responseJson.data as { name: string }).name).toBe("acme");
    const count = await Konk.countDocuments();
    expect(count).toBe(1);
  });
});
