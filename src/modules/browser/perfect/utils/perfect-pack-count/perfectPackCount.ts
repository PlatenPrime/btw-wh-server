function extractPackCountFromTitle(title: string): number | null {
  if (!title) return null;
  const patterns = [/\((\d+)\s*шт\.?\)/i, /(\d+)\s*шт\.?/i];
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (!match?.[1]) continue;
    const count = parseInt(match[1], 10);
    if (Number.isFinite(count) && count > 0) {
      return count;
    }
  }
  return null;
}

/** «Штук в упаковці: N» на карточке (укр.), если в названии нет «N шт». */
const PACK_COUNT_UK_HTML_REGEX = /Штук\s+в\s+упаковці\s*:\s*(\d+)/i;

function extractPackCountFromProductHtml(html: string): number | null {
  const match = html.match(PACK_COUNT_UK_HTML_REGEX);
  if (!match?.[1]) return null;
  const count = parseInt(match[1], 10);
  if (!Number.isFinite(count) || count <= 0) return null;
  return count;
}

export function resolvePackCount(title: string, html?: string): number | null {
  const fromTitle = extractPackCountFromTitle(title);
  if (fromTitle !== null) return fromTitle;
  if (html?.trim()) {
    return extractPackCountFromProductHtml(html);
  }
  return null;
}
