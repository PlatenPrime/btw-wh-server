import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../models/Sku.js";
import { deleteSkuByIdController } from "../delete-sku-by-id/deleteSkuByIdController.js";

describe("deleteSkuByIdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Sku.deleteMany({});
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

  it("400 for invalid id", async () => {
    const req = { params: { id: "bad-id" } } as unknown as Request;
    await deleteSkuByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("200 deletes sku", async () => {
    const sku = await Sku.create({
      konkName: "k1",
      prodName: "p1",
      title: "To delete",
      url: "https://k1.com/to-delete",
    });
    const req = { params: { id: sku._id.toString() } } as unknown as Request;
    await deleteSkuByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Sku deleted successfully");
  });
});
