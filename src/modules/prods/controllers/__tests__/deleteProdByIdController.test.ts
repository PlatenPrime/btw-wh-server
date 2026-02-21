import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../models/Prod.js";
import { deleteProdByIdController } from "../delete-prod-by-id/deleteProdByIdController.js";

describe("deleteProdByIdController", () => {
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

  it("400 when id invalid", async () => {
    const req = { params: { id: "invalid" } } as unknown as Request;
    await deleteProdByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when prod not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
    } as unknown as Request;
    await deleteProdByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 deletes prod", async () => {
    const prod = await Prod.create({
      name: "to-delete",
      title: "To Delete",
      imageUrl: "https://x.com/1.png",
    });
    const req = { params: { id: prod._id.toString() } } as unknown as Request;
    await deleteProdByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    const found = await Prod.findById(prod._id);
    expect(found).toBeNull();
  });
});
