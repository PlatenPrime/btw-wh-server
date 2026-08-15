/**
 * Опция селекта size: префикс сырого PDP-поля до первого `/`.
 * `"14\" / 13x34 cm"` → `"14\""`. Пусто после trim — не опция.
 */
export function parseGraboSizeOption(size: string): string | null {
  const beforeSlash = size.trim().split("/")[0]?.trim() ?? "";
  return beforeSlash === "" ? null : beforeSlash;
}
