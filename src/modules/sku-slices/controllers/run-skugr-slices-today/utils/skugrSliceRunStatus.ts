const runningSkugrIds = new Set<string>();

/**
 * In-memory lock на ручной scrape срезов по одной товарной группе.
 * @returns true если lock захвачен; false если этот skugr уже в работе
 */
export function tryAcquireSkugrSliceRun(skugrId: string): boolean {
  const key = skugrId.trim();
  if (!key) {
    return false;
  }
  if (runningSkugrIds.has(key)) {
    return false;
  }
  runningSkugrIds.add(key);
  return true;
}

export function releaseSkugrSliceRun(skugrId: string): void {
  runningSkugrIds.delete(skugrId.trim());
}

export function isSkugrSliceRunActive(skugrId: string): boolean {
  return runningSkugrIds.has(skugrId.trim());
}

/** Только для тестов — сброс всех locks. */
export function clearSkugrSliceRunsForTests(): void {
  runningSkugrIds.clear();
}
