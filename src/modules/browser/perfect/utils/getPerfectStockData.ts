import * as cheerio from "cheerio";
import { getBrowserAxios, logBrowserError } from "../../utils/browserRequest.js";

export interface PerfectProductInfo {
  stock: number;
  price: number;
  title?: string;
}

interface PerfectCartProduct {
  stock_quantity?: number | string;
  price_without_reduction?: number | string;
  embedded_attributes?: {
    price_without_reduction?: number | string;
    price?: number | string;
    name?: string;
  };
  name?: string;
  price?: number | string;
}

interface PerfectCartResponse {
  success?: boolean;
  cart?: {
    products?: PerfectCartProduct[];
  };
}

const PERFECT_CART_URL = "https://perfectparty.in.ua/cart";
const PERFECT_CART_SHOW_URL = "https://perfectparty.in.ua/cart?action=show";
const NEGATIVE_OUTCOME: PerfectProductInfo = { stock: -1, price: -1 };
const PRICE_TEXT_REGEX = /([\d\s,.]+)/;

function parseNumberLike(value: unknown): number | null {
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

function extractToken(html: string): string | null {
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

function extractProductId(html: string, productUrl: string): string | null {
  const idFromUrlMatch = productUrl.match(/\/(\d+)-[^/]+\.html(?:\?.*)?$/i);
  if (idFromUrlMatch?.[1]) return idFromUrlMatch[1];

  const idPatterns = [/"item_id":"(\d+)"/, /"id_product":"(\d+)"/];
  for (const pattern of idPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractTitle(html: string): string {
  const $ = cheerio.load(html);
  const h1 = $("h1").first().text().trim();
  if (h1) return h1;
  const og = $('meta[property="og:title"]').attr("content")?.trim();
  return og ?? "";
}

function parseCartResponse(raw: string): PerfectCartResponse | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as PerfectCartResponse;
  } catch {
    return null;
  }
}

function pickHeaderCaseInsensitive(
  headers: Record<string, unknown>,
  key: string
): unknown {
  const wanted = key.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === wanted) return v;
  }
  return undefined;
}

function parseSetCookieHeader(setCookie: unknown): string[] {
  if (Array.isArray(setCookie)) {
    return setCookie.filter((item): item is string => typeof item === "string");
  }
  if (typeof setCookie === "string") {
    return [setCookie];
  }
  return [];
}

function mergeCookies(existingCookieHeader: string, setCookie: unknown): string {
  const cookieMap = new Map<string, string>();

  if (existingCookieHeader.trim()) {
    const parts = existingCookieHeader.split(";");
    for (const part of parts) {
      const pair = part.trim();
      if (!pair) continue;
      const eq = pair.indexOf("=");
      if (eq <= 0) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (name) cookieMap.set(name, value);
    }
  }

  const setCookieRows = parseSetCookieHeader(setCookie);
  for (const row of setCookieRows) {
    const firstPart = row.split(";")[0]?.trim() ?? "";
    if (!firstPart) continue;
    const eq = firstPart.indexOf("=");
    if (eq <= 0) continue;
    const name = firstPart.slice(0, eq).trim();
    const value = firstPart.slice(eq + 1).trim();
    if (name) cookieMap.set(name, value);
  }

  return [...cookieMap.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function parsePackPrice(product: PerfectCartProduct): number | null {
  const direct = parseNumberLike(product.price_without_reduction);
  if (direct !== null) return direct;

  const embeddedDirect = parseNumberLike(
    product.embedded_attributes?.price_without_reduction
  );
  if (embeddedDirect !== null) return embeddedDirect;

  const embeddedText = parseNumberLike(product.embedded_attributes?.price);
  if (embeddedText !== null) return embeddedText;

  return parseNumberLike(product.price);
}

function toStockAndPrice(
  stockPacks: number,
  packPrice: number,
  title: string
): PerfectProductInfo {
  const packCount = extractPackCountFromTitle(title);
  if (!packCount) {
    return {
      stock: stockPacks,
      price: packPrice,
      ...(title && { title }),
    };
  }

  return {
    stock: stockPacks * packCount,
    price: Number((packPrice / packCount).toFixed(2)),
    ...(title && { title }),
  };
}

/**
 * Получает остаток и цену товара с perfectparty.in.ua через запрос add-to-cart в корзину.
 * Если в названии товара найдено «N шт», возвращает остаток в штуках и цену за штуку.
 */
export async function getPerfectStockData(link: string): Promise<PerfectProductInfo> {
  if (!link || typeof link !== "string") {
    throw new Error("Link is required and must be a string");
  }

  const productUrl = link.trim();
  if (!productUrl) {
    throw new Error("Link is required and must be a string");
  }

  try {
    const client = getBrowserAxios();
    const htmlResponse = await client.get<string>(productUrl, {
      responseType: "text",
      transformResponse: [(data: unknown) => data],
    });
    const html = String(htmlResponse.data ?? "");
    if (!html.trim()) return NEGATIVE_OUTCOME;

    const htmlRespHeaders =
      (htmlResponse as { headers?: Record<string, unknown> }).headers ?? {};
    let cookieHeader = mergeCookies(
      "",
      pickHeaderCaseInsensitive(htmlRespHeaders, "set-cookie")
    );

    let token = extractToken(html);
    const productId = extractProductId(html, productUrl);
    if (!productId) return NEGATIVE_OUTCOME;

    // На части страниц token не встроен в HTML карточки, но есть на странице корзины.
    if (!token) {
      const cartShowResp = await client.get<string>(PERFECT_CART_SHOW_URL, {
        headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
        responseType: "text",
        transformResponse: [(data: unknown) => data],
      });
      const cartShowHeaders =
        (cartShowResp as { headers?: Record<string, unknown> }).headers ?? {};
      cookieHeader = mergeCookies(
        cookieHeader,
        pickHeaderCaseInsensitive(cartShowHeaders, "set-cookie")
      );
      token = extractToken(String(cartShowResp.data ?? ""));
      if (!token) return NEGATIVE_OUTCOME;
    }

    const pageTitle = extractTitle(html);
    const formData = new URLSearchParams({
      token,
      id_product: productId,
      id_customization: "0",
      qty: "1",
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      id_country: "216",
      id_toc_state: "325",
      city: "",
      address: "",
      add: "1",
      action: "update",
    });

    const cartResp = await client.post<string>(PERFECT_CART_URL, formData.toString(), {
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Origin: "https://perfectparty.in.ua",
        Referer: productUrl,
        "X-Requested-With": "XMLHttpRequest",
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
      responseType: "text",
      transformResponse: [(data: unknown) => data],
    });

    const cartData = parseCartResponse(String(cartResp.data ?? ""));
    const product = cartData?.cart?.products?.[0];
    if (!product) return NEGATIVE_OUTCOME;

    const stockPacksRaw = parseNumberLike(product.stock_quantity);
    const packPrice = parsePackPrice(product);
    if (stockPacksRaw === null || packPrice === null) return NEGATIVE_OUTCOME;

    const stockPacks = Math.floor(stockPacksRaw);
    if (!Number.isFinite(stockPacks) || stockPacks < 0) return NEGATIVE_OUTCOME;

    const title = (
      product.name ??
      product.embedded_attributes?.name ??
      pageTitle
    ).trim();

    return toStockAndPrice(stockPacks, packPrice, title);
  } catch (error) {
    logBrowserError("Error fetching data from perfectparty product page:", error);
    return NEGATIVE_OUTCOME;
  }
}
