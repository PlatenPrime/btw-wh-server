const PRICE_TEXT_REGEX = /([\d\s,.]+)/;

export function parseNumberLike(value: unknown): number | null {
  if (typeof value === "number") {
    if (Number.isFinite(value) && value >= 0) return value;
    return null;
  }
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\u00a0/g, " ").trim();
  if (!cleaned) return null;
  const match = cleaned.match(PRICE_TEXT_REGEX);
  if (!match?.[1]) return null;
  const normalized = match[1].replace(/\s/g, "").replace(",", ".");
  const parsed = parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}
