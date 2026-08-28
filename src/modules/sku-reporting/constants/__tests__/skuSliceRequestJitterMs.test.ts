import { describe, expect, it } from "vitest";
import {
  AIR_SKU_SLICE_CHUNK_MAX_FETCHES,
  AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MIN_MS,
  AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MAX_MS,
  AIR_SKU_SLICE_CLUSTER_PAUSE_MAX_MS,
  AIR_SKU_SLICE_CLUSTER_PAUSE_MIN_MS,
  AIR_SKU_SLICE_CLUSTER_SIZE,
  isAirSkuSliceChunkKonk,
  resolveSkuSliceRequestJitterMs,
  shouldEndAirSkuSliceChunk,
  shouldPauseAirSkuSliceCluster,
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

  it("air override is 2000–5000 ms", () => {
    expect(SKU_SLICE_REQUEST_JITTER_BY_KONK.air).toEqual({
      minMs: 2000,
      maxMs: 5000,
    });
  });

  it("air cluster pause is 10 SKUs then 20–40 s", () => {
    expect(AIR_SKU_SLICE_CLUSTER_SIZE).toBe(10);
    expect(AIR_SKU_SLICE_CLUSTER_PAUSE_MIN_MS).toBe(20_000);
    expect(AIR_SKU_SLICE_CLUSTER_PAUSE_MAX_MS).toBe(40_000);
  });

  it("air chunk max fetches is 1200 with 45–60 min inter-chunk pause", () => {
    expect(AIR_SKU_SLICE_CHUNK_MAX_FETCHES).toBe(1200);
    expect(AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MIN_MS).toBe(45 * 60 * 1000);
    expect(AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MAX_MS).toBe(60 * 60 * 1000);
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

  it("returns air 2000–5000 range case-insensitively", () => {
    expect(resolveSkuSliceRequestJitterMs("air")).toEqual({
      minMs: 2000,
      maxMs: 5000,
    });
    expect(resolveSkuSliceRequestJitterMs(" AIR ")).toEqual({
      minMs: 2000,
      maxMs: 5000,
    });
  });
});

describe("shouldPauseAirSkuSliceCluster", () => {
  it("pauses after 10th when more remain, not after last", () => {
    expect(shouldPauseAirSkuSliceCluster(10, 11)).toBe(true);
    expect(shouldPauseAirSkuSliceCluster(20, 21)).toBe(true);
    expect(shouldPauseAirSkuSliceCluster(10, 10)).toBe(false);
    expect(shouldPauseAirSkuSliceCluster(9, 11)).toBe(false);
    expect(shouldPauseAirSkuSliceCluster(0, 11)).toBe(false);
  });
});

describe("air chunk helpers", () => {
  it("isAirSkuSliceChunkKonk is case-insensitive", () => {
    expect(isAirSkuSliceChunkKonk("air")).toBe(true);
    expect(isAirSkuSliceChunkKonk(" AIR ")).toBe(true);
    expect(isAirSkuSliceChunkKonk("balun")).toBe(false);
  });

  it("shouldEndAirSkuSliceChunk at 1200", () => {
    expect(shouldEndAirSkuSliceChunk(1199)).toBe(false);
    expect(shouldEndAirSkuSliceChunk(1200)).toBe(true);
    expect(shouldEndAirSkuSliceChunk(1201)).toBe(true);
  });
});
