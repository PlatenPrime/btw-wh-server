import {
  resolveSliceRotationConfig,
  type SliceRotationConfig,
} from "../config/sliceRotationByKonk.js";
import { stableStringBucket } from "./stableStringBucket.js";

const MS_PER_DAY = 86_400_000;

/**
 * Индекс дня в rotation-цикле по ключу среза (UTC midnight YMD).
 * Один sliceDate → один dayIndex при фиксированном cycleDays.
 */
export function getSliceRotationDayIndex(
  sliceDate: Date,
  cycleDays: number
): number {
  if (cycleDays < 2) {
    throw new Error(
      `getSliceRotationDayIndex: cycleDays must be >= 2, got ${cycleDays}`
    );
  }
  const dayNumber = Math.floor(sliceDate.getTime() / MS_PER_DAY);
  return ((dayNumber % cycleDays) + cycleDays) % cycleDays;
}

export function getProductRotationBucket(
  productId: string,
  cycleDays: number
): number {
  return stableStringBucket(productId.trim(), cycleDays);
}

export function isProductDueForSliceRotation(
  productId: string,
  sliceDate: Date,
  config: SliceRotationConfig
): boolean {
  const key = productId.trim();
  if (!key) {
    return false;
  }
  const dayIndex = getSliceRotationDayIndex(sliceDate, config.cycleDays);
  return getProductRotationBucket(key, config.cycleDays) === dayIndex;
}

export type SliceRotationInfo = {
  cycleDays: number;
  dayIndex: number;
};

export function resolveSliceRotationInfo(
  konkName: string,
  sliceDate: Date
): SliceRotationInfo | null {
  const config = resolveSliceRotationConfig(konkName);
  if (!config) {
    return null;
  }
  return {
    cycleDays: config.cycleDays,
    dayIndex: getSliceRotationDayIndex(sliceDate, config.cycleDays),
  };
}

export function filterProductsForSliceRotation<T extends { productId?: string }>(
  items: T[],
  sliceDate: Date,
  konkName: string
): { filtered: T[]; rotation: SliceRotationInfo | null } {
  const config = resolveSliceRotationConfig(konkName);
  if (!config) {
    return { filtered: items, rotation: null };
  }
  const rotation: SliceRotationInfo = {
    cycleDays: config.cycleDays,
    dayIndex: getSliceRotationDayIndex(sliceDate, config.cycleDays),
  };
  const filtered = items.filter((item) =>
    isProductDueForSliceRotation(item.productId ?? "", sliceDate, config)
  );
  return { filtered, rotation };
}
