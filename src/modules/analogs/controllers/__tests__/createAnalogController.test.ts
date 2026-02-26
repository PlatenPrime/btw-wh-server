import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../arts/models/Art.js";
import { Analog } from "../../models/Analog.js";
import { createAnalogController } from "../create-analog/createAnalogController.js";

describe("createAnalogController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Analog.deleteMany({});
    await Art.deleteMany({});
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

  it("400 when body missing required fields", async () => {
    const req = { body: { konkName: "k" } } as unknown as Request;
    await createAnalogController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("400 when no artikul and missing title and imageUrl", async () => {
    const req = {
      body: {
        konkName: "k",
        prodName: "p",
        url: "https://x.com",
      },
    } as unknown as Request;
    await createAnalogController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("201 creates analog with required fields and title/imageUrl", async () => {
    const req = {
      body: {
        konkName: "acme",
        prodName: "maker",
        url: "https://example.com/page",
        title: "Product",
        imageUrl: "https://example.com/img.png",
      },
    } as unknown as Request;
    await createAnalogController(req, res);
    expect(responseStatus.code).toBe(201);
    expect((responseJson.data as { konkName: string }).konkName).toBe("acme");
    const count = await Analog.countDocuments();
    expect(count).toBe(1);
  });

  it("201 creates analog with artikul and pulls nameukr from Art", async () => {
    await Art.create({
      artikul: "ART-1",
      nameukr: "Назва",
      zone: "A1",
    });
    const req = {
      body: {
        konkName: "k",
        prodName: "p",
        url: "https://x.com",
        artikul: "ART-1",
      },
    } as unknown as Request;
    await createAnalogController(req, res);
    expect(responseStatus.code).toBe(201);
    expect((responseJson.data as { nameukr: string }).nameukr).toBe("Назва");
  });
});
