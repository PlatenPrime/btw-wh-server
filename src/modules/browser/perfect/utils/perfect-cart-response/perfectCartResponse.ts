import { tryParseJsonRecord } from "../../../utils/try-parse-json-record/tryParseJsonRecord.js";
import { parseNumberLike } from "../parse-number-like/parseNumberLike.js";

export interface PerfectCartProduct {
  id_product?: number | string;
  id_product_attribute?: number | string;
  id_customization?: number | string;
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

export interface PerfectCartDeleteIds {
  idProduct: string;
  idProductAttribute: string | null;
  idCustomization: string;
}

function stringifyCartId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

export function resolvePerfectCartDeleteIds(
  product: PerfectCartProduct | undefined,
  fallback: PerfectCartDeleteIds
): PerfectCartDeleteIds {
  if (!product) return fallback;
  return {
    idProduct: stringifyCartId(product.id_product) ?? fallback.idProduct,
    idProductAttribute:
      stringifyCartId(product.id_product_attribute) ?? fallback.idProductAttribute,
    idCustomization:
      stringifyCartId(product.id_customization) ?? fallback.idCustomization,
  };
}

export interface PerfectCartResponse {
  success?: boolean;
  cart?: {
    products?: PerfectCartProduct[];
  };
}

export function parseCartResponse(raw: string): PerfectCartResponse | null {
  const parsed = tryParseJsonRecord(raw);
  return parsed as PerfectCartResponse | null;
}

export function parsePackPrice(product: PerfectCartProduct): number | null {
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
