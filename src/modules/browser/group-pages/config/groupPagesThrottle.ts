export const GROUP_PAGES_THROTTLE_MIN_DELAY_MS = 800;
export const GROUP_PAGES_THROTTLE_MAX_DELAY_MS = 1600;

/**
 * Возвращает случайную задержку для перехода между страницами группы.
 * Диапазон включительный: [minDelayMs, maxDelayMs].
 */
export function getGroupPagesThrottleDelayMs(
  minDelayMs = GROUP_PAGES_THROTTLE_MIN_DELAY_MS,
  maxDelayMs = GROUP_PAGES_THROTTLE_MAX_DELAY_MS
): number {
  const min = Math.trunc(minDelayMs);
  const max = Math.trunc(maxDelayMs);
  if (min <= 0 || max <= 0 || min > max) {
    throw new Error(
      `Invalid group pages throttle range: min=${minDelayMs}, max=${maxDelayMs}`
    );
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
