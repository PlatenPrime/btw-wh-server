/**
 * Підпис колонки з календарним днем у Excel: укр. день тижня + дата YYYY-MM-DD (UTC, як у slice-датах).
 */
export function formatExcelDateHeaderUk(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const isoPart = `${y}-${m}-${day}`;

  const weekday = new Intl.DateTimeFormat("uk-UA", {
    weekday: "long",
    timeZone: "UTC",
  }).format(d);

  return `${weekday}, ${isoPart}`;
}
