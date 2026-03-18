import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Variant } from "../../models/Variant.js";
import { deleteVariantByIdController } from "../delete-variant-by-id/deleteVariantByIdController.js";

describe("deleteVariantByIdController", () => {
  let res: Response;
  let responseStatus: { code?: number };
  let responseJson: Record<string, unknown>;

  beforeEach(async () => {
    await Variant.deleteMany({});
    responseStatus = {};
    responseJson = {};
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
    await deleteVariantByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when variant not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
    } as unknown as Request;

    await deleteVariantByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 deletes variant", async () => {
    const variant = await Variant.create({
      konkName: "k",
      prodName: "p",
      title: "Variant",
      url: "https://x.com",
      imageUrl: "https://example.com/img.png",
    });

    const req = { params: { id: variant._id.toString() } } as unknown as Request;
    await deleteVariantByIdController(req, res);

    expect(responseStatus.code).toBe(200);
    const found = await Variant.findById(variant._id);
    expect(found).toBeNull();
  });
});

