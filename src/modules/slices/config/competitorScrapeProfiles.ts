import { normalizeCompetitorName } from "./excludedCompetitors.js";

export type ScrapeRunKind = "skuSlice" | "groupPagesFill" | "groupPagesPage";

export type JitterRange = {
  minMs: number;
  maxMs: number;
};

export type TierPauseConfig = {
  every: number;
  pauseMinMs: number;
  pauseMaxMs: number;
};

export type ChunkConfig = {
  maxFetches: number;
  interChunkPauseMinMs: number;
  interChunkPauseMaxMs: number;
};

export type CompetitorScrapeProfile = {
  requestJitter: JitterRange;
  cluster?: TierPauseConfig;
  block?: TierPauseConfig;
  chunk?: ChunkConfig;
  interUnit?: JitterRange;
  interUnitCluster?: TierPauseConfig;
  consecutiveInvalidAbort?: number;
};

export const DEFAULT_SKU_SLICE_REQUEST_JITTER: JitterRange = {
  minMs: 500,
  maxMs: 1500,
};

export const DEFAULT_GROUP_PAGES_PAGE_JITTER: JitterRange = {
  minMs: 800,
  maxMs: 1600,
};

export const DEFAULT_GROUP_PAGES_FILL_JITTER: JitterRange = {
  minMs: 0,
  maxMs: 0,
};

const AIR_SKU_SLICE_PROFILE: CompetitorScrapeProfile = {
  requestJitter: { minMs: 2000, maxMs: 5000 },
  cluster: { every: 10, pauseMinMs: 20_000, pauseMaxMs: 40_000 },
  block: {
    every: 100,
    pauseMinMs: 4 * 60 * 1000,
    pauseMaxMs: 6 * 60 * 1000,
  },
  chunk: {
    maxFetches: 1000,
    interChunkPauseMinMs: 45 * 60 * 1000,
    interChunkPauseMaxMs: 60 * 60 * 1000,
  },
  consecutiveInvalidAbort: 15,
};

const AIR_GROUP_PAGES_FILL_PROFILE: CompetitorScrapeProfile = {
  requestJitter: DEFAULT_GROUP_PAGES_FILL_JITTER,
  interUnit: { minMs: 45_000, maxMs: 90_000 },
  interUnitCluster: { every: 5, pauseMinMs: 20_000, pauseMaxMs: 40_000 },
};

const AIR_GROUP_PAGES_PAGE_PROFILE: CompetitorScrapeProfile = {
  requestJitter: { minMs: 2000, maxMs: 4000 },
};

export const DEFAULT_SCRAPE_PROFILES: Readonly<
  Record<ScrapeRunKind, CompetitorScrapeProfile>
> = {
  skuSlice: {
    requestJitter: DEFAULT_SKU_SLICE_REQUEST_JITTER,
  },
  groupPagesFill: {
    requestJitter: DEFAULT_GROUP_PAGES_FILL_JITTER,
  },
  groupPagesPage: {
    requestJitter: DEFAULT_GROUP_PAGES_PAGE_JITTER,
  },
};

/**
 * Per-konk override поверх DEFAULT_SCRAPE_PROFILES[runKind].
 */
export const COMPETITOR_SCRAPE_PROFILE_OVERRIDES: Readonly<
  Record<string, Partial<Record<ScrapeRunKind, CompetitorScrapeProfile>>>
> = {
  air: {
    skuSlice: AIR_SKU_SLICE_PROFILE,
    groupPagesFill: AIR_GROUP_PAGES_FILL_PROFILE,
    groupPagesPage: AIR_GROUP_PAGES_PAGE_PROFILE,
  },
};

function mergeProfile(
  base: CompetitorScrapeProfile,
  override?: CompetitorScrapeProfile
): CompetitorScrapeProfile {
  if (!override) {
    return base;
  }
  return {
    ...base,
    ...override,
    requestJitter: override.requestJitter ?? base.requestJitter,
    cluster: override.cluster ?? base.cluster,
    block: override.block ?? base.block,
    chunk: override.chunk ?? base.chunk,
    interUnit: override.interUnit ?? base.interUnit,
    interUnitCluster: override.interUnitCluster ?? base.interUnitCluster,
    consecutiveInvalidAbort:
      override.consecutiveInvalidAbort ?? base.consecutiveInvalidAbort,
  };
}

export function resolveScrapeProfile(
  konkName: string,
  runKind: ScrapeRunKind
): CompetitorScrapeProfile {
  const key = normalizeCompetitorName(konkName);
  const base = DEFAULT_SCRAPE_PROFILES[runKind];
  const override = COMPETITOR_SCRAPE_PROFILE_OVERRIDES[key]?.[runKind];
  return mergeProfile(base, override);
}

export function hasSkuSliceChunkProfile(konkName: string): boolean {
  return resolveScrapeProfile(konkName, "skuSlice").chunk != null;
}
