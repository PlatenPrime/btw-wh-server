import {
  formatKonkSliceReportLines,
  type KonkSliceStats,
} from "./formatKonkSliceStats.js";

export function formatAnalogSlicesReport(
  competitors: KonkSliceStats[],
  excluded: string[] = []
): string {
  const lines = [
    "📊 Analog slices — завершено",
    ...formatKonkSliceReportLines(competitors),
  ];

  if (excluded.length > 0) {
    lines.push(`Пропущено: ${excluded.join(", ")}`);
  }

  return lines.join("\n");
}
