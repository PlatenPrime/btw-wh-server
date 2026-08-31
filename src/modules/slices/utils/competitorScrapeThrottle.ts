import { jitterMs } from "../../../utils/jitterMs.js";
import {
  resolveScrapeProfile,
  type JitterRange,
  type ScrapeRunKind,
  type TierPauseConfig,
} from "../config/competitorScrapeProfiles.js";

export function resolveScrapeRequestJitter(
  konkName: string,
  runKind: ScrapeRunKind
): JitterRange {
  return resolveScrapeProfile(konkName, runKind).requestJitter;
}

export function resolveGroupPagesPageJitter(konkName: string): JitterRange {
  return resolveScrapeRequestJitter(konkName, "groupPagesPage");
}

export function getGroupPagesPageDelayMs(konkName: string): number {
  const range = resolveGroupPagesPageJitter(konkName);
  return jitterMs(range.minMs, range.maxMs);
}

export function resolveInterUnitJitter(
  konkName: string,
  runKind: ScrapeRunKind = "groupPagesFill"
): JitterRange | null {
  const interUnit = resolveScrapeProfile(konkName, runKind).interUnit;
  if (!interUnit || interUnit.maxMs <= 0) {
    return null;
  }
  return interUnit;
}

export function resolveInterUnitClusterPause(
  konkName: string,
  runKind: ScrapeRunKind = "groupPagesFill"
): TierPauseConfig | null {
  return resolveScrapeProfile(konkName, runKind).interUnitCluster ?? null;
}

export function shouldApplyInterUnitClusterPause(args: {
  konkName: string;
  completedUnits: number;
  isLast: boolean;
  runKind?: ScrapeRunKind;
}): boolean {
  if (args.isLast || args.completedUnits <= 0) {
    return false;
  }
  const cluster = resolveInterUnitClusterPause(
    args.konkName,
    args.runKind ?? "groupPagesFill"
  );
  if (!cluster) {
    return false;
  }
  return args.completedUnits % cluster.every === 0;
}

export function resolveInterUnitClusterPauseMs(
  konkName: string,
  runKind: ScrapeRunKind = "groupPagesFill"
): number | null {
  const cluster = resolveInterUnitClusterPause(konkName, runKind);
  if (!cluster) {
    return null;
  }
  return jitterMs(cluster.pauseMinMs, cluster.pauseMaxMs);
}

export function resolveInterUnitDelayMs(
  konkName: string,
  runKind: ScrapeRunKind = "groupPagesFill"
): number | null {
  const range = resolveInterUnitJitter(konkName, runKind);
  if (!range) {
    return null;
  }
  return jitterMs(range.minMs, range.maxMs);
}
