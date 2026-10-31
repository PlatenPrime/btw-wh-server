import type { BalunProductInfo } from "../balun-product-types/balunProductInfo.js";
import { BALUN_NEGATIVE_OUTCOME } from "../balun-product-types/balunProductInfo.js";

export function normalizeBalunOutcome(
  stock: number,
  price: number | undefined,
  artikul?: string,
): BalunProductInfo {
  if (price === undefined) {
    return artikul ? { ...BALUN_NEGATIVE_OUTCOME, artikul } : BALUN_NEGATIVE_OUTCOME;
  }
  return artikul ? { stock, price, artikul } : { stock, price };
}
