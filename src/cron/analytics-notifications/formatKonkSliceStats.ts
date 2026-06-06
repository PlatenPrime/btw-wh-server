export type KonkSliceStats = {
  konkName: string;
  count: number;
  invalid: number;
  errors: number;
  total: number;
};

export function formatKonkSliceLine(stats: KonkSliceStats): string {
  return `${stats.konkName}: ✅${stats.count} / ❌${stats.errors} / ⚠️${stats.invalid}`;
}

export function formatKonkSliceReportLines(
  competitors: KonkSliceStats[]
): string[] {
  return competitors.map(formatKonkSliceLine);
}
