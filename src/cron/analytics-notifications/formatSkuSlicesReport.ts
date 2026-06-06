import {
  formatKonkSliceReportLines,
  type KonkSliceStats,
} from "./formatKonkSliceStats.js";

export function formatSkuSlicesReport(
  competitors: KonkSliceStats[],
  excluded: string[] = []
): string {
  const lines = [
    "📊 SKU slices — завершено",
    ...formatKonkSliceReportLines(competitors),
  ];

  if (excluded.length > 0) {
    lines.push(`Пропущено: ${excluded.join(", ")}`);
  }

  return lines.join("\n");
}
