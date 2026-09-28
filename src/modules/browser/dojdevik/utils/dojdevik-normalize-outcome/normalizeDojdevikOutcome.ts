import { toMoney } from "../../../utils/to-money/toMoney.js";
import type { DojdevikProductInfo } from "../dojdevik-product-types/dojdevikProductInfo.js";
import { DOJDEVIK_NEGATIVE_OUTCOME } from "../dojdevik-product-types/dojdevikProductInfo.js";

/**
 * Packs × packSize → штуки; packagePrice / packSize → цена за штуку (2 знака).
 */
export function normalizeDojdevikOutcome(
  packs: number,
  packagePrice: number | undefined,
  packSize: number,
  title: string
): DojdevikProductInfo {
  if (packagePrice === undefined) {
    return DOJDEVIK_NEGATIVE_OUTCOME;
  }

  const price = toMoney(packagePrice / packSize);
  const stock = packs * packSize;
  return title.length > 0 ? { stock, price, title } : { stock, price };
}
