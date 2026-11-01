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

/** Ведущее число из value вида `6`, `6 шт.`, `6 шт`. */
function parseLeadingPositiveInt(raw: string | undefined): number | null {
  if (!raw) {
    return null;
  }
  const match = raw.trim().match(/^(\d+)/);
  return parsePositiveInt(match?.[1]);
}

const ATTR_PAIR_REGEX =
  /data-qaid=["']attribute_name["'][^>]*>([^<]*)<\/td>\s*<td[^>]*data-qaid=["']attribute_value["'][^>]*>([^<]*)<\/td>/gi;

/** Фасовка продаваемой упаковки — не мастер-короб. */
const PACK_ATTR_NAME_REGEX = /пачц[іи]|упаковц[іи]|набор[іи]/i;
const BOX_ATTR_NAME_REGEX = /коробц/i;

const DESCRIPTION_PACK_REGEX = /Кількість\s+в\s+упаковці\s+(\d+)\s*шт/i;

/** Title: «по 6 штук у пакованні», «(6 шт)». */
const TITLE_PACK_PATTERNS = [/по\s+(\d+)\s*штук(?:и)?\s+у\s+пакованн/i, /\((\d+)\s*шт\.?\)/i];

function extractFromAttributes(html: string): number | null {
  for (const match of html.matchAll(ATTR_PAIR_REGEX)) {
    const name = match[1] ?? "";
    const value = match[2] ?? "";
    if (BOX_ATTR_NAME_REGEX.test(name)) {
      continue;
    }
    if (!PACK_ATTR_NAME_REGEX.test(name)) {
      continue;
    }
    const count = parseLeadingPositiveInt(value);
    if (count !== null) {
      return count;
    }
  }
  return null;
}

function extractFromDescription(html: string): number | null {
  const match = html.match(DESCRIPTION_PACK_REGEX);
  return parsePositiveInt(match?.[1]);
}

function extractFromTitle(html: string): number | null {
  for (const pattern of TITLE_PACK_PATTERNS) {
    const match = html.match(pattern);
    const count = parsePositiveInt(match?.[1]);
    if (count !== null) {
      return count;
    }
  }
  return null;
}

/**
 * Размер пачки из HTML карточки dojdevik.
 * Приоритет: характеристика фасовки (пачці / упаковці / наборі; не коробці),
 * затем описание «Кількість в упаковці N шт», затем title («по N штук…» / «(N шт)»).
 * Fallback — 1.
 */
export function extractDojdevikPackCount(html: string): number {
  if (!html) {
    return 1;
  }

  const fromAttrs = extractFromAttributes(html);
  if (fromAttrs !== null) {
    return fromAttrs;
  }

  const fromDescription = extractFromDescription(html);
  if (fromDescription !== null) {
    return fromDescription;
  }

  const fromTitle = extractFromTitle(html);
  if (fromTitle !== null) {
    return fromTitle;
  }

  return 1;
}
