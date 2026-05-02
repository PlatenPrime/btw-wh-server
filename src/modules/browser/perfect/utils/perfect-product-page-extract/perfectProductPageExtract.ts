import * as cheerio from "cheerio";

export function extractToken(html: string): string | null {
  const tokenPatterns = [
    /token:\s*"([a-z0-9]{16,})"/i,
    /"token"\s*:\s*"([a-z0-9]{16,})"/i,
    /\btoken=([a-z0-9]{16,})\b/i,
    /name=["']token["'][^>]*value=["']([a-z0-9]{16,})["']/i,
  ];
  for (const pattern of tokenPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function extractProductId(html: string, productUrl: string): string | null {
  const idFromUrlMatch = productUrl.match(/\/(\d+)-[^/]+\.html(?:\?.*)?$/i);
  if (idFromUrlMatch?.[1]) return idFromUrlMatch[1];

  const idPatterns = [/"item_id":"(\d+)"/, /"id_product":"(\d+)"/];
  for (const pattern of idPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function extractTitle(html: string): string {
  const $ = cheerio.load(html);
  const h1 = $("h1").first().text().trim();
  if (h1) return h1;
  const og = $('meta[property="og:title"]').attr("content")?.trim();
  return og ?? "";
}
