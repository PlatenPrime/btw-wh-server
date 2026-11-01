/** Доля part/total в процентах 0..100 с 2 знаками; при total=0 → 0. */
export function computeSharePercent(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total === 0) return 0;
  return Math.round((part / total) * 10000) / 100;
}
