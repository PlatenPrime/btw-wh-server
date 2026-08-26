import { describe, expect, it } from "vitest";
import {
  resolveSkuSliceRequestJitterMs,
  SKU_SLICE_REQUEST_JITTER_BY_KONK,
  SKU_SLICE_REQUEST_JITTER_MAX_MS,
  SKU_SLICE_REQUEST_JITTER_MIN_MS,
} from "../skuSliceRequestJitterMs.js";

describe("skuSliceRequestJitterMs constants", () => {
  it("defines a positive default jitter range with min less than max", () => {
    expect(SKU_SLICE_REQUEST_JITTER_MIN_MS).toBe(500);
    expect(SKU_SLICE_REQUEST_JITTER_MAX_MS).toBe(1500);
    expect(SKU_SLICE_REQUEST_JITTER_MIN_MS).toBeLessThan(
      SKU_SLICE_REQUEST_JITTER_MAX_MS
    );
  });

  it("air override is 2x default", () => {
    expect(SKU_SLICE_REQUEST_JITTER_BY_KONK.air).toEqual({
      minMs: 1000,
      maxMs: 3000,
    });
  });
});

describe("resolveSkuSliceRequestJitterMs", () => {
  it("returns default for unknown konk", () => {
    expect(resolveSkuSliceRequestJitterMs("balun")).toEqual({
      minMs: 500,
      maxMs: 1500,
    });
  });

  it("returns default for empty / blank", () => {
    expect(resolveSkuSliceRequestJitterMs("")).toEqual({
      minMs: 500,
      maxMs: 1500,
    });
    expect(resolveSkuSliceRequestJitterMs("   ")).toEqual({
      minMs: 500,
      maxMs: 1500,
    });
  });

  it("returns air 2x range case-insensitively", () => {
    expect(resolveSkuSliceRequestJitterMs("air")).toEqual({
      minMs: 1000,
      maxMs: 3000,
    });
    expect(resolveSkuSliceRequestJitterMs(" AIR ")).toEqual({
      minMs: 1000,
      maxMs: 3000,
    });
  });
});
