import { jitterMs } from "../../../../utils/jitterMs.js";
import {
  DEFAULT_GROUP_PAGES_PAGE_JITTER,
  resolveScrapeProfile,
} from "../../../slices/config/competitorScrapeProfiles.js";
import { getGroupPagesPageDelayMs as resolveKonkPageDelayMs } from "../../../slices/utils/competitorScrapeThrottle.js";

export const GROUP_PAGES_THROTTLE_MIN_DELAY_MS =
  DEFAULT_GROUP_PAGES_PAGE_JITTER.minMs;
export const GROUP_PAGES_THROTTLE_MAX_DELAY_MS =
  DEFAULT_GROUP_PAGES_PAGE_JITTER.maxMs;

/**
 * Возвращает случайную задержку для перехода между страницами группы.
 * Без konkName — дефолт 800–1600 ms (legacy).
 * С konkName — resolveScrapeProfile(..., groupPagesPage).
 */
export function getGroupPagesThrottleDelayMs(): number;
export function getGroupPagesThrottleDelayMs(
  minDelayMs: number,
  maxDelayMs?: number
): number;
export function getGroupPagesThrottleDelayMs(konkName: string): number;
export function getGroupPagesThrottleDelayMs(
  minDelayMsOrKonkName?: number | string,
  maxDelayMs?: number
): number {
  if (typeof minDelayMsOrKonkName === "string") {
    return resolveKonkPageDelayMs(minDelayMsOrKonkName);
  }
  const min = Math.trunc(
    minDelayMsOrKonkName ?? GROUP_PAGES_THROTTLE_MIN_DELAY_MS
  );
  const max = Math.trunc(maxDelayMs ?? GROUP_PAGES_THROTTLE_MAX_DELAY_MS);
  if (min <= 0 || max <= 0 || min > max) {
    throw new Error(
      `Invalid group pages throttle range: min=${minDelayMsOrKonkName}, max=${maxDelayMs}`
    );
  }
  return jitterMs(min, max);
}

export function getGroupPagesThrottleDelayMsForKonk(konkName: string): number {
  return resolveKonkPageDelayMs(konkName);
}

/** Jitter-диапазон между страницами для konk (для тестов/логов). */
export function resolveGroupPagesPageJitterRange(konkName: string): {
  minMs: number;
  maxMs: number;
} {
  return resolveScrapeProfile(konkName, "groupPagesPage").requestJitter;
}
