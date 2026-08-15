import { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GraboSku } from "../../../models/GraboSku.js";
import { getAllGraboSkusController } from "../getAllGraboSkusController.js";

function graboSkuDoc(overrides: Record<string, unknown> = {}) {
  const productId = (overrides.productId as string) ?? "G00001";
  return {
    title: "Title",
    productId,
    url: `https://www.grabo-balloons.com/en/${productId.toLowerCase()}`,
    lastSeenAt: new Date("2026-08-15T00:00:00.000Z"),
    ...overrides,
  };
}

describe("getAllGraboSkusController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await GraboSku.deleteMany({});
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("400 for invalid query", async () => {
    const req = { query: { page: "-1" } } as unknown as Request;
    await getAllGraboSkusController(req, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid query parameters");
  });

  it("200 returns data and pagination without filterOptions", async () => {
    await GraboSku.create(graboSkuDoc({ productId: "G1", color: "Pink" }));

    const req = { query: {} } as unknown as Request;
    await getAllGraboSkusController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Grabo skus retrieved successfully");
    expect(Array.isArray(responseJson.data)).toBe(true);
    expect((responseJson.data as unknown[]).length).toBe(1);
    expect(responseJson.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 1,
    });
    expect(responseJson).not.toHaveProperty("filterOptions");
  });

  it("200 includes filterOptions when flag is true", async () => {
    await GraboSku.create(graboSkuDoc({ productId: "G1", color: "Pink" }));

    const req = {
      query: { includeFilterOptions: "true" },
    } as unknown as Request;
    await getAllGraboSkusController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.filterOptions).toEqual(
      expect.objectContaining({
        color: ["Pink"],
      })
    );
  });

  it("500 when listing fails", async () => {
    vi.spyOn(GraboSku, "find").mockImplementation(() => {
      throw new Error("db down");
    });
    const req = { query: {} } as unknown as Request;
    await getAllGraboSkusController(req, res);
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
  });

  it("does not send 500 if headers already sent", async () => {
    vi.spyOn(GraboSku, "find").mockImplementation(() => {
      throw new Error("db down");
    });
    (res as { headersSent: boolean }).headersSent = true;
    const req = { query: {} } as unknown as Request;
    await getAllGraboSkusController(req, res);
    expect(responseStatus.code).toBeUndefined();
  });
});
