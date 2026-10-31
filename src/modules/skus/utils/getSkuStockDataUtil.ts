import { Sku } from "../models/Sku.js";
import { getAirStockData } from "../../browser/air/utils/getAirStockData.js";
import { getBalunStockData } from "../../browser/balun/utils/getBalunStockData.js";
import { getYumiStockData } from "../../browser/yumi/utils/getYumiStockData.js";
import { getYuminStockData } from "../../browser/yumin/utils/getYuminStockData.js";
import { getSharteStockData } from "../../browser/sharte/utils/getSharteStockData.js";
import { getPerfectStockData } from "../../browser/perfect/utils/getPerfectStockData.js";
import { getSvbumStockData } from "../../browser/svbum/utils/getSvbumStockData.js";
import { getDojdevikStockData } from "../../browser/dojdevik/utils/getDojdevikStockData.js";
import { maybeSetSkuArtikulIfEmpty } from "./maybeSetSkuArtikulIfEmpty.js";

export const UNSUPPORTED_KONK_CODE = "UNSUPPORTED_KONK";

export interface SkuStockResult {
  stock: number;
  price: number;
}

type StockDataFn = (url: string) => Promise<{
  stock: number;
  price?: number;
  artikul?: string;
}>;

const KONK_STOCK_GETTERS: Record<string, StockDataFn> = {
  air: getAirStockData,
  balun: getBalunStockData,
  yumi: getYumiStockData,
  yumin: getYuminStockData,
  sharte: getSharteStockData,
  perfect: getPerfectStockData,
  svbum: getSvbumStockData,
  dojdevik: getDojdevikStockData,
};

/**
 * Остаток и цена по SKU: по konkName выбирается геттер, вызов с sku.url.
 * Побочно: write-once заполнение `Sku.artikul`, если геттер вернул артикул.
 */
export async function getSkuStockDataUtil(skuId: string): Promise<SkuStockResult | null> {
  const sku = await Sku.findById(skuId).select("konkName url").lean();

  if (!sku) return null;

  const key = (sku.konkName ?? "").trim().toLowerCase();
  const getter = KONK_STOCK_GETTERS[key];
  if (!getter) {
    const err = new Error(`Unsupported competitor for stock: ${sku.konkName}`) as Error & {
      code?: string;
    };
    err.code = UNSUPPORTED_KONK_CODE;
    throw err;
  }

  const result = await getter(sku.url);
  const price = result.price !== undefined && result.price !== null ? result.price : -1;

  await maybeSetSkuArtikulIfEmpty(skuId, result.artikul);

  return {
    stock: result.stock,
    price,
  };
}
