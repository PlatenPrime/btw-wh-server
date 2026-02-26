import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../models/Analog.js";
import { deleteAnalogByIdController } from "../delete-analog-by-id/deleteAnalogByIdController.js";

describe("deleteAnalogByIdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Analog.deleteMany({});
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
    await deleteAnalogByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when analog not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
    } as unknown as Request;
    await deleteAnalogByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 deletes analog", async () => {
    const analog = await Analog.create({
      konkName: "k",
      prodName: "p",
      url: "https://x.com",
    });
    const req = { params: { id: analog._id.toString() } } as unknown as Request;
    await deleteAnalogByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    const found = await Analog.findById(analog._id);
    expect(found).toBeNull();
  });
});
