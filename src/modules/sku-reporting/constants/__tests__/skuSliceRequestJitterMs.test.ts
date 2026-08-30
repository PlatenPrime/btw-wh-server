import { describe, expect, it } from "vitest";
import {
  AIR_SKU_SLICE_BLOCK_PAUSE_MAX_MS,
  AIR_SKU_SLICE_BLOCK_PAUSE_MIN_MS,
  AIR_SKU_SLICE_BLOCK_SIZE,
  AIR_SKU_SLICE_CHUNK_MAX_FETCHES,
  AIR_SKU_SLICE_CONSECUTIVE_INVALID_ABORT,
  AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MIN_MS,
  AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MAX_MS,
  AIR_SKU_SLICE_CLUSTER_PAUSE_MAX_MS,
  AIR_SKU_SLICE_CLUSTER_PAUSE_MIN_MS,
  AIR_SKU_SLICE_CLUSTER_SIZE,
  isAirSkuSliceChunkKonk,
  resolveAirSkuSlicePauseKind,
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

  it("air block pause is 100 SKUs then 4–6 min", () => {
    expect(AIR_SKU_SLICE_BLOCK_SIZE).toBe(100);
    expect(AIR_SKU_SLICE_BLOCK_PAUSE_MIN_MS).toBe(4 * 60 * 1000);
    expect(AIR_SKU_SLICE_BLOCK_PAUSE_MAX_MS).toBe(6 * 60 * 1000);
  });

  it("air chunk max fetches is 1000 with 45–60 min inter-chunk pause", () => {
    expect(AIR_SKU_SLICE_CHUNK_MAX_FETCHES).toBe(1000);
    expect(AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MIN_MS).toBe(45 * 60 * 1000);
    expect(AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MAX_MS).toBe(60 * 60 * 1000);
  });

  it("consecutive invalid abort threshold is 15", () => {
    expect(AIR_SKU_SLICE_CONSECUTIVE_INVALID_ABORT).toBe(15);
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

describe("resolveAirSkuSlicePauseKind", () => {
  it("returns none for last or zero", () => {
    expect(resolveAirSkuSlicePauseKind(10, true)).toBe("none");
    expect(resolveAirSkuSlicePauseKind(0, false)).toBe("none");
  });

  it("returns cluster after 10, not 100/1000", () => {
    expect(resolveAirSkuSlicePauseKind(10, false)).toBe("cluster");
    expect(resolveAirSkuSlicePauseKind(20, false)).toBe("cluster");
    expect(resolveAirSkuSlicePauseKind(90, false)).toBe("cluster");
  });

  it("returns block after 100, not stacked with cluster", () => {
    expect(resolveAirSkuSlicePauseKind(100, false)).toBe("block");
    expect(resolveAirSkuSlicePauseKind(200, false)).toBe("block");
    expect(resolveAirSkuSlicePauseKind(900, false)).toBe("block");
  });

  it("returns none on chunk boundary 1000 (inter-chunk owns pause)", () => {
    expect(resolveAirSkuSlicePauseKind(1000, false)).toBe("none");
    expect(resolveAirSkuSlicePauseKind(2000, false)).toBe("none");
  });

  it("returns none between pause boundaries", () => {
    expect(resolveAirSkuSlicePauseKind(1, false)).toBe("none");
    expect(resolveAirSkuSlicePauseKind(9, false)).toBe("none");
    expect(resolveAirSkuSlicePauseKind(11, false)).toBe("none");
    expect(resolveAirSkuSlicePauseKind(99, false)).toBe("none");
    expect(resolveAirSkuSlicePauseKind(101, false)).toBe("none");
  });
});

describe("air chunk helpers", () => {
  it("isAirSkuSliceChunkKonk is case-insensitive", () => {
    expect(isAirSkuSliceChunkKonk("air")).toBe(true);
    expect(isAirSkuSliceChunkKonk(" AIR ")).toBe(true);
    expect(isAirSkuSliceChunkKonk("balun")).toBe(false);
  });

  it("shouldEndAirSkuSliceChunk at 1000", () => {
    expect(shouldEndAirSkuSliceChunk(999)).toBe(false);
    expect(shouldEndAirSkuSliceChunk(1000)).toBe(true);
    expect(shouldEndAirSkuSliceChunk(1001)).toBe(true);
  });
});
