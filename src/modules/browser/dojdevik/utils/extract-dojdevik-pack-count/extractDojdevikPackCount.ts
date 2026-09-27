function parsePositiveInt(raw: string | undefined): number | null {
  if (!raw) {
    return null;
  }
  const count = parseInt(raw, 10);
  if (!Number.isFinite(count) || count < 1) {
    return null;
  }
  return count;
}

/**
 * Размер пачки из HTML карточки dojdevik.
 * Приоритет: характеристика «Кількість в пачці» (`data-qaid="attribute_value"`),
 * затем описание «Кількість в упаковці N шт». Fallback — 1.
 */
export function extractDojdevikPackCount(html: string): number {
  if (!html) {
    return 1;
  }

  const fromAttrs = html.match(
    /Кількість\s+в\s+пачці\.?\s*<\/td>\s*<td[^>]*data-qaid=["']attribute_value["'][^>]*>\s*(\d+)\s*</i
  );
  const attrsCount = parsePositiveInt(fromAttrs?.[1]);
  if (attrsCount !== null) {
    return attrsCount;
  }

  const fromDescription = html.match(
    /Кількість\s+в\s+упаковці\s+(\d+)\s*шт/i
  );
  const descriptionCount = parsePositiveInt(fromDescription?.[1]);
  if (descriptionCount !== null) {
    return descriptionCount;
  }

  return 1;
}
