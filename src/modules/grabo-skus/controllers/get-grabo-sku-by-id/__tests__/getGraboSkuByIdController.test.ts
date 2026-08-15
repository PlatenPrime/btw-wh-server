import { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GraboSku } from "../../../models/GraboSku.js";
import { getGraboSkuByIdController } from "../getGraboSkuByIdController.js";

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

describe("getGraboSkuByIdController", () => {
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

  it("400 for invalid id", async () => {
    const req = { params: { id: "bad-id" } } as unknown as Request;
    await getGraboSkuByIdController(req, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("404 when grabo sku is missing", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
    } as unknown as Request;
    await getGraboSkuByIdController(req, res);
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Grabo sku not found");
  });

  it("200 returns the document", async () => {
    const saved = await GraboSku.create(
      graboSkuDoc({ productId: "G72274", title: "Pink Ribbon" })
    );
    const req = { params: { id: saved._id.toString() } } as unknown as Request;
    await getGraboSkuByIdController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Grabo sku retrieved successfully");
    expect((responseJson.data as { productId: string }).productId).toBe(
      "G72274"
    );
  });

  it("500 when lookup fails", async () => {
    vi.spyOn(GraboSku, "findById").mockImplementation(() => {
      throw new Error("db down");
    });
    const req = {
      params: { id: "000000000000000000000000" },
    } as unknown as Request;
    await getGraboSkuByIdController(req, res);
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
  });

  it("does not send 500 if headers already sent", async () => {
    vi.spyOn(GraboSku, "findById").mockImplementation(() => {
      throw new Error("db down");
    });
    (res as { headersSent: boolean }).headersSent = true;
    const req = {
      params: { id: "000000000000000000000000" },
    } as unknown as Request;
    await getGraboSkuByIdController(req, res);
    expect(responseStatus.code).toBeUndefined();
  });
});
