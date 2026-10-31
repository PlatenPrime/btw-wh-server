/**
 * Убирает ручную аннотацию `artikul: ...` в начале txt-фикстур до `<!DOCTYPE` / `<html`.
 */
export function stripSkuProductCodeFixturePreamble(raw: string): string {
  const idx = raw.search(/<!DOCTYPE|<html/i);
  return idx >= 0 ? raw.slice(idx) : raw;
}
