import type { BalunProductInfo } from "../balun-product-types/balunProductInfo.js";
import { BALUN_NEGATIVE_OUTCOME } from "../balun-product-types/balunProductInfo.js";

export function normalizeBalunOutcome(
  stock: number,
  price: number | undefined
): BalunProductInfo {
  if (price === undefined) {
    return BALUN_NEGATIVE_OUTCOME;
  }
  return { stock, price };
}
