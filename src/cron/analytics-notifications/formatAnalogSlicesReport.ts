import {
  formatKonkSliceLine,
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

/** Одно TG-сообщение по конкуренту после его analog-среза. */
export function formatAnalogKonkSliceReport(stats: KonkSliceStats): string {
  return `📊 Analog slices — ${stats.konkName}\n${formatKonkSliceLine(stats)}`;
}

/** Короткое TG-сообщение со списком исключённых конкурентов analog cron. */
export function formatAnalogSlicesExcludedReport(excluded: string[]): string {
  return `📊 Analog slices — пропущено: ${excluded.join(", ")}`;
}
