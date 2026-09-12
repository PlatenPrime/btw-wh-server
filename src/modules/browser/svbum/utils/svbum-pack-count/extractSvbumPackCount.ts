/** Количество штук из «(Nшт)» / «(N шт)» / «N шт» в названии товара или варианта. */
export function extractSvbumPackCount(title: string): number | null {
  if (!title) {
    return null;
  }

  const patterns = [/\((\d+)\s*шт\.?\)/i, /(\d+)\s*шт\.?/i];
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (!match?.[1]) {
      continue;
    }
    const count = parseInt(match[1], 10);
    if (Number.isFinite(count) && count > 0) {
      return count;
    }
  }

  return null;
}
