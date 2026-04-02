/** Календарный день срезов: Europe/Kiev (как кроны и бизнес-логика). */
const SLICE_TIMEZONE = "Europe/Kiev";

const kyivCalendarPartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SLICE_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatKyivYmd(d: Date): string {
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
export function toSliceDate(d: Date): Date {
  const ymd = formatKyivYmd(d);
  return new Date(`${ymd}T00:00:00.000Z`);
}

/**
 * Ключ среза на следующий календарный день в Киеве (для вечернего крона: та же дата,
 * что дал бы `toSliceDate` в полночь наступившего дня).
 */
export function toNextKyivSliceDate(d: Date): Date {
  const ymd = formatKyivYmd(d);
  const [yStr, mStr, dStr] = ymd.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const day = Number(dStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(day)) {
    throw new Error("toNextKyivSliceDate: invalid YMD from Europe/Kiev");
  }
  const next = new Date(Date.UTC(y, m - 1, day + 1));
  const yy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(next.getUTCDate()).padStart(2, "0");
  return new Date(`${yy}-${mm}-${dd}T00:00:00.000Z`);
}
