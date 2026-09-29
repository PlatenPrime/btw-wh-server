/**
 * In-memory lock на ручной run срезов по одной Skugr (сегодня).
 */
const runningSkugrIds = new Set<string>();

/**
 * @returns true если lock захвачен; false если этот skugrId уже в работе
 */
export function tryAcquireSkugrSliceRun(skugrId: string): boolean {
  const key = skugrId.trim();
  if (!key) return false;
  if (runningSkugrIds.has(key)) return false;
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
