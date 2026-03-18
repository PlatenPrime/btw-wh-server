import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Variant } from "../../models/Variant.js";
import { getVariantByIdController } from "../get-variant-by-id/getVariantByIdController.js";

describe("getVariantByIdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Variant.deleteMany({});
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
    await getVariantByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when variant not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
    } as unknown as Request;
    await getVariantByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 returns variant", async () => {
    const variant = await Variant.create({
      konkName: "k",
      prodName: "p",
      title: "Variant X",
      url: "https://x.com/variant-x",
      imageUrl: "https://example.com/x.png",
    });

    const req = {
      params: { id: variant._id.toString() },
    } as unknown as Request;

    await getVariantByIdController(req, res);

    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as { title: string }).title).toBe("Variant X");
  });
});

