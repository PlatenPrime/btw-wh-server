import { Sku } from "../models/Sku.js";
import { getBalunStockData } from "../../browser/balun/utils/getBalunStockData.js";
import { getYumiStockData } from "../../browser/yumi/utils/getYumiStockData.js";
import { getYuminStockData } from "../../browser/yumin/utils/getYuminStockData.js";
import { getSharteStockData } from "../../browser/sharte/utils/getSharteStockData.js";
import { getPerfectStockData } from "../../browser/perfect/utils/getPerfectStockData.js";
export const UNSUPPORTED_KONK_CODE = "UNSUPPORTED_KONK";
const KONK_STOCK_GETTERS = {
    balun: getBalunStockData,
    yumi: getYumiStockData,
    yumin: getYuminStockData,
    sharte: getSharteStockData,
    perfect: getPerfectStockData,
};
/**
 * Остаток и цена по SKU: по konkName выбирается геттер, вызов с sku.url.
 * Air не поддерживается серверным scrape — только client-ingestion в sku-slices.
 */
export async function getSkuStockDataUtil(skuId) {
    const sku = await Sku.findById(skuId).select("konkName url").lean();
    if (!sku)
        return null;
    const key = (sku.konkName ?? "").trim().toLowerCase();
    const getter = KONK_STOCK_GETTERS[key];
    if (!getter) {
        const err = new Error(`Unsupported competitor for stock: ${sku.konkName}`);
        err.code = UNSUPPORTED_KONK_CODE;
        throw err;
    }
    const result = await getter(sku.url);
    const price = result.price !== undefined && result.price !== null ? result.price : -1;
    return {
        stock: result.stock,
        price,
    };
}
