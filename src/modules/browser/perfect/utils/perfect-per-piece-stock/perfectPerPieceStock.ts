import type { PerfectProductInfo } from "./perfectProductInfo.js";
import { resolvePackCount } from "../perfect-pack-count/perfectPackCount.js";

/** Остаток в штуках и цена за штуку, если известна фасовка из title или блока «Штук в упаковці» в HTML. */
export function toStockAndPrice(
  stockPacks: number,
  packPrice: number,
  title: string,
  html?: string
): PerfectProductInfo {
  const packCount = resolvePackCount(title, html);
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
