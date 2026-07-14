import * as cheerio from "cheerio";

/** Имя товара из JSON-LD (видимый h1 часто внутри text/x-template и недоступен cheerio). */
export function parseLdJsonProductName($: cheerio.CheerioAPI): string | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    const raw = $(scripts[i]).html();
    if (!raw) {
      continue;
    }
    try {
      const data = JSON.parse(raw.trim()) as { "@type"?: string; name?: string };
      if (data["@type"] === "Product" && typeof data.name === "string") {
        return data.name;
      }
    } catch {
      continue;
    }
  }
  return null;
}
