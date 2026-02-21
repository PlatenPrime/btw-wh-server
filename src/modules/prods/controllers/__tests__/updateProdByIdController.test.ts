import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../models/Prod.js";
import { updateProdByIdController } from "../update-prod-by-id/updateProdByIdController.js";

describe("updateProdByIdController", () => {
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
    const req = {
      params: { id: "invalid" },
      body: { title: "New" },
    } as unknown as Request;
    await updateProdByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when prod not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
      body: { title: "New" },
    } as unknown as Request;
    await updateProdByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 updates and returns data", async () => {
    const prod = await Prod.create({
      name: "x",
      title: "Old",
      imageUrl: "https://x.com/1.png",
    });
    const req = {
      params: { id: prod._id.toString() },
      body: { title: "New Title" },
    } as unknown as Request;
    await updateProdByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as { title: string }).title).toBe("New Title");
  });
});
