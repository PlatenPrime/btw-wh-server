/**
 * Извлекает неотрицательное число из «грязной» строки цены: убирает всё кроме цифр, запятой, точки и пробелов.
 */
export function parseStrippedDecimal(raw: string | undefined | null): number | null {
  if (!raw) {
    return null;
  }

  const cleaned = raw.replace(/[^\d,.\s]/g, "").replace(/\s+/g, "");
  if (!cleaned) {
    return null;
  }

  const normalized = cleaned.replace(/,/g, ".");
  const value = parseFloat(normalized);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  return value;
}
