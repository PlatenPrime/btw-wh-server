import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../../models/Del.js";
import { getDelByIdController } from "../get-del-by-id/getDelByIdController.js";

describe("getDelByIdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Del.deleteMany({});
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

  it("404 when del not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
    } as unknown as Request;
    await getDelByIdController(req, res);
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Del not found");
  });

  it("400 on invalid id", async () => {
    const req = { params: { id: "invalid" } } as unknown as Request;
    await getDelByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("200 returns full document", async () => {
    const del = await Del.create({
      title: "Full Del",
      artikuls: { A1: { quantity: 1 } },
    });
    const req = { params: { id: del._id.toString() } } as unknown as Request;
    await getDelByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as any).title).toBe("Full Del");
    expect((responseJson.data as any).artikuls).toBeDefined();
  });
});
