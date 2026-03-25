/** Календарный день срезов: Europe/Kiev (как кроны и бизнес-логика). */
const SLICE_TIMEZONE = "Europe/Kiev";
const kyivCalendarPartsFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: SLICE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});
function formatKyivYmd(d) {
    const parts = kyivCalendarPartsFormatter.formatToParts(d);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    if (!y || !m || !day) {
        throw new Error("toSliceDate: could not read calendar date in Europe/Kiev");
    }
    return `${y}-${m}-${day}`;
}
/**
 * Ключ дня среза: календарная дата по стенным часам Киева (`Europe/Kiev`),
 * хранится как `YYYY-MM-DDT00:00:00.000Z` — тот же контракт, что у `dateStringSchema`
 * (строка `YYYY-MM-DD` из API).
 */
export function toSliceDate(d) {
    const ymd = formatKyivYmd(d);
    return new Date(`${ymd}T00:00:00.000Z`);
}
