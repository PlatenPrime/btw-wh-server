import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../../models/Del.js";
import { updateDelArtikulsByDelIdController } from "../update-del-artikuls-by-del-id/updateDelArtikulsByDelIdController.js";

describe("updateDelArtikulsByDelIdController", () => {
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
    await updateDelArtikulsByDelIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("202 when del found and process started", async () => {
    const del = await Del.create({
      title: "Del",
      prodName: "prod1",
      prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
      artikuls: { A1: { quantity: 0 } },
    });
    const req = { params: { id: del._id.toString() } } as unknown as Request;
    await updateDelArtikulsByDelIdController(req, res);
    expect(responseStatus.code).toBe(202);
    expect(responseJson.message).toContain("started");
  });
});
