import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../models/Sku.js";
import { maybeSetSkuArtikulIfEmpty } from "../maybeSetSkuArtikulIfEmpty.js";

describe("maybeSetSkuArtikulIfEmpty", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
  });

  async function createSku(overrides?: { artikul?: string }) {
    return Sku.create({
      konkName: "air",
      prodName: "p1",
      productId: "air-1",
      title: "T",
      url: "https://air.example/1",
      ...(overrides?.artikul !== undefined ? { artikul: overrides.artikul } : {}),
    });
  }

  it("sets artikul when empty", async () => {
    const sku = await createSku();
    await maybeSetSkuArtikulIfEmpty(sku._id.toString(), "SDR-120");
    const refreshed = await Sku.findById(sku._id).lean();
    expect(refreshed?.artikul).toBe("SDR-120");
  });

  it("does not overwrite non-empty artikul", async () => {
    const sku = await createSku({ artikul: "KEEP" });
    await maybeSetSkuArtikulIfEmpty(sku._id.toString(), "NEW");
    const refreshed = await Sku.findById(sku._id).lean();
    expect(refreshed?.artikul).toBe("KEEP");
  });

  it("no-ops on blank or missing artikul argument", async () => {
    const sku = await createSku();
    await maybeSetSkuArtikulIfEmpty(sku._id.toString(), "  ");
    await maybeSetSkuArtikulIfEmpty(sku._id.toString(), null);
    await maybeSetSkuArtikulIfEmpty(sku._id.toString(), undefined);
    const refreshed = await Sku.findById(sku._id).lean();
    expect(refreshed?.artikul).toBe("");
  });

  it("trims artikul before set", async () => {
    const sku = await createSku({ artikul: "" });
    await maybeSetSkuArtikulIfEmpty(sku._id.toString(), "  11033  ");
    const refreshed = await Sku.findById(sku._id).lean();
    expect(refreshed?.artikul).toBe("11033");
  });
});
