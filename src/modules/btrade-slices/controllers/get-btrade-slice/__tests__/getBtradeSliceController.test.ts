import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { BtradeSlice } from "../../../models/BtradeSlice.js";
import { getBtradeSliceController } from "../getBtradeSliceController.js";

describe("getBtradeSliceController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(() => {
    responseJson = {};
    responseStatus = {};
    res = {
      status(code: number) {
        responseStatus.code = code;
        return this;
      },
      json(data: Record<string, unknown>) {
        responseJson = data;
        return this;
      },
    } as unknown as Response;
  });

  it("200: returns slice for valid date query", async () => {
    const date = new Date("2025-03-01T00:00:00.000Z");
    await BtradeSlice.create({
      date,
      data: { "ART-1": { price: 100, quantity: 5 } },
    });

    const req = { query: { date: "2025-03-01" } } as unknown as Request;

    await getBtradeSliceController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Btrade slice retrieved successfully");
    expect(
      (responseJson.data as { items: Array<Record<string, unknown>> }).items
    ).toEqual([
      {
        artikul: "ART-1",
        quantity: 5,
        price: 100,
        art: null,
      },
    ]);
    expect(responseJson.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
  });

  it("400: validation error for invalid date format", async () => {
    const req = { query: { date: "01-03-2025" } } as unknown as Request;

    await getBtradeSliceController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
    expect(Array.isArray(responseJson.errors)).toBe(true);
  });

  it("404: slice not found for given date", async () => {
    const req = { query: { date: "2025-03-01" } } as unknown as Request;

    await getBtradeSliceController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Btrade slice not found");
  });
});
