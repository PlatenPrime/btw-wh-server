/**
 * Стабильный bucket 0..cycleDays-1 для строки (FNV-1a 32-bit).
 * Один и тот же input всегда даёт один bucket при фиксированном cycleDays.
 */
export function stableStringBucket(value: string, cycleDays: number): number {
  if (cycleDays < 1) {
    throw new Error(`stableStringBucket: cycleDays must be >= 1, got ${cycleDays}`);
  }
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % cycleDays;
}
