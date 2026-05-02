import { tryParseJsonRecord } from "../../../utils/try-parse-json-record/tryParseJsonRecord.js";
import { parseNumberLike } from "../parse-number-like/parseNumberLike.js";

export interface PerfectCartProduct {
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
