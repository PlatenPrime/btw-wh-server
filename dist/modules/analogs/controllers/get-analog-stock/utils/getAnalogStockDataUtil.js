import { Analog } from "../../../models/Analog.js";
import { getAirStockData } from "../../../../browser/air/utils/getAirStockData.js";
import { getBalunStockData } from "../../../../browser/balun/utils/getBalunStockData.js";
import { getYumiStockData } from "../../../../browser/yumi/utils/getYumiStockData.js";
import { getSharteStockData } from "../../../../browser/sharte/utils/getSharteStockData.js";
export const UNSUPPORTED_KONK_CODE = "UNSUPPORTED_KONK";
const KONK_STOCK_GETTERS = {
    air: getAirStockData,
    balun: getBalunStockData,
    yumi: getYumiStockData,
    sharte: getSharteStockData,
};
/**
 * Получает остаток и цену по аналогу: загружает аналог по id,
 * по konkName выбирает утилиту скрапинга и вызывает её с analog.url.
 * @param analogId — id документа аналога
 * @returns { stock, price } или null если аналог не найден
 * @throws Error с code === UNSUPPORTED_KONK_CODE при неподдерживаемом konkName
 */
export async function getAnalogStockDataUtil(analogId) {
    const analog = await Analog.findById(analogId)
        .select("konkName url")
        .lean();
    if (!analog)
        return null;
    const getter = KONK_STOCK_GETTERS[analog.konkName];
    if (!getter) {
        const err = new Error(`Unsupported competitor for stock: ${analog.konkName}`);
        err.code = UNSUPPORTED_KONK_CODE;
        throw err;
    }
    const result = await getter(analog.url);
    const price = result.price !== undefined && result.price !== null
        ? result.price
        : -1;
    return {
        stock: result.stock,
        price,
    };
}
