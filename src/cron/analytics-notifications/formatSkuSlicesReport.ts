import {
  formatKonkSliceLine,
  type KonkSliceStats,
} from "./formatKonkSliceStats.js";

export function formatSkuSlicesReport(
  competitors: KonkSliceStats[],
  excluded: string[] = []
): string {
  const lines = [
    "📊 SKU slices — завершено",
    ...competitors.map(formatKonkSliceLine),
  ];

  if (excluded.length > 0) {
    lines.push(`Пропущено: ${excluded.join(", ")}`);
  }

  return lines.join("\n");
}

/** Одно TG-сообщение по конкуренту после его SKU-среза. */
export function formatSkuKonkSliceReport(stats: KonkSliceStats): string {
  return `📊 SKU slices — ${stats.konkName}\n${formatKonkSliceLine(stats)}`;
}

/** Короткое TG-сообщение со списком исключённых конкурентов SKU cron. */
export function formatSkuSlicesExcludedReport(excluded: string[]): string {
  return `📊 SKU slices — пропущено: ${excluded.join(", ")}`;
}
