import { formatKonkSliceLine, formatKonkSliceReportLines, } from "./formatKonkSliceStats.js";
export function formatAnalogSlicesReport(competitors, excluded = []) {
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
export function formatAnalogKonkSliceReport(stats) {
    return `📊 Analog slices — ${stats.konkName}\n${formatKonkSliceLine(stats)}`;
}
/** Короткое TG-сообщение со списком исключённых конкурентов analog cron. */
export function formatAnalogSlicesExcludedReport(excluded) {
    return `📊 Analog slices — пропущено: ${excluded.join(", ")}`;
}
