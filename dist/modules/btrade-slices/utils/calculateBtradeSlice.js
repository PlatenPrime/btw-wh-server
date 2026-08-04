import { toSliceDate } from "../../../utils/sliceDate.js";
import { isInvalidSliceStockPriceItem } from "../../slices/utils/isInvalidSliceStockPriceItem.js";
import { getCachedSharikProductRestsMap } from "../../browser/sharik/utils/product-rests/index.js";
import { BtradeSlice } from "../models/BtradeSlice.js";
import { getUniqueArtikulsFromArtsUtil } from "./getUniqueArtikulsFromArtsUtil.js";
import { logModuleInfo } from "../../../logging/logModuleError.js";
const MISSING_SLICE_SENTINEL = { price: -1, quantity: -1 };
/**
 * Собирает ежедневный срез цен и остатков Btrade (Sharik):
 * один запрос/cache product_rests, quantity = sliceQuantity, одна запись data в MongoDB.
 */
export async function calculateBtradeSlice() {
    const sliceDate = toSliceDate(new Date());
    const artikuls = await getUniqueArtikulsFromArtsUtil();
    const totalArtikuls = artikuls.length;
    logModuleInfo("btrade-slices", "btrade slice product_rests load started", {
        artikulCount: artikuls.length,
    });
    const productRestsMap = await getCachedSharikProductRestsMap();
    const data = {};
    for (const artikul of artikuls) {
        const row = productRestsMap.get(artikul);
        if (row) {
            data[artikul] = { price: row.price, quantity: row.sliceQuantity };
        }
        else {
            data[artikul] = MISSING_SLICE_SENTINEL;
        }
    }
    const fromProductRests = artikuls.filter((artikul) => !isInvalidSliceStockPriceItem(data[artikul].quantity, data[artikul].price)).length;
    let count = 0;
    let missing = 0;
    for (const artikul of artikuls) {
        const item = data[artikul];
        if (isInvalidSliceStockPriceItem(item.quantity, item.price)) {
            missing += 1;
        }
        else {
            count += 1;
        }
    }
    await BtradeSlice.findOneAndUpdate({ date: sliceDate }, { $set: { date: sliceDate, data } }, { upsert: true });
    logModuleInfo("btrade-slices", "btrade slice completed", {
        fromProductRests,
        valid: count,
        missing,
    });
    return {
        saved: true,
        count,
        totalArtikuls,
        missing,
        fromProductRests,
    };
}
