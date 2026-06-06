import { formatKonkSliceReportLines, } from "./formatKonkSliceStats.js";
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
