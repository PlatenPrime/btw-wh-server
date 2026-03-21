import type { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkuSliceController } from "../getSkuSliceController.js";

describe("getSkuSliceController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await SkuSlice.deleteMany({});
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

  it("400 when query invalid", async () => {
    const req = { query: {} } as unknown as Request;
    await getSkuSliceController(req, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("404 when slice missing", async () => {
    const req = {
      query: { konkName: "air", date: "2026-03-01" },
    } as unknown as Request;
    await getSkuSliceController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 returns slice data", async () => {
    await SkuSlice.create({
      konkName: "air",
      date: new Date("2026-03-01T00:00:00.000Z"),
      data: { "air-1": { stock: 2, price: 5 } },
    });
    const req = {
      query: { konkName: "air", date: "2026-03-01" },
    } as unknown as Request;
    await getSkuSliceController(req, res);
    expect(responseStatus.code).toBe(200);
    const data = responseJson.data as Record<string, unknown>;
    expect(data.konkName).toBe("air");
    expect((data.data as Record<string, { stock: number }>)["air-1"].stock).toBe(
      2
    );
  });
});
