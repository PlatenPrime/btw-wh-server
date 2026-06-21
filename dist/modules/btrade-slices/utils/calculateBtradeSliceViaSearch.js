import { getSharikStockData } from "../../browser/sharik/utils/getSharikStockData.js";
import { delay } from "../../../utils/delay.js";
import { jitterMs } from "../../../utils/jitterMs.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { BtradeSlice } from "../models/BtradeSlice.js";
import { getUniqueArtikulsFromArtsUtil } from "./getUniqueArtikulsFromArtsUtil.js";
import { logModuleDebug, logModuleError } from "../../../logging/logModuleError.js";
const JITTER_MIN_MS = 200;
const JITTER_MAX_MS = 1000;
/**
 * Неактивная альтернатива: срез через поиск sharik.ua/ua/search/ по каждому артикулу.
 * Поштучные обновления data в MongoDB.
 */
export async function calculateBtradeSliceViaSearch() {
    const sliceDate = toSliceDate(new Date());
    const artikuls = await getUniqueArtikulsFromArtsUtil();
    await BtradeSlice.findOneAndUpdate({ date: sliceDate }, { $setOnInsert: { date: sliceDate, data: {} } }, { upsert: true });
    let count = 0;
    for (let i = 0; i < artikuls.length; i++) {
        const artikul = artikuls[i];
        logModuleDebug("btrade-slices", "btrade slice search processing artikul", {
            index: i + 1,
            total: artikuls.length,
            artikul,
        });
        try {
            const result = await getSharikStockData(artikul);
            if (result) {
                await BtradeSlice.findOneAndUpdate({ date: sliceDate }, {
                    $set: {
                        [`data.${artikul}`]: {
                            price: result.price,
                            quantity: result.quantity,
                        },
                    },
                });
                count += 1;
            }
        }
        catch (err) {
            logModuleError("btrade-slices", err, "btrade slice search failed", { artikul });
        }
        if (i < artikuls.length - 1) {
            await delay(jitterMs(JITTER_MIN_MS, JITTER_MAX_MS));
        }
    }
    return { saved: true, count };
}
/**
 * Догружает отсутствующие артикулы через search и возвращает дополненный data.
 */
export async function fetchMissingBtradeSliceItemsViaSearch(missingArtikuls) {
    const fromSearch = {};
    for (let i = 0; i < missingArtikuls.length; i++) {
        const artikul = missingArtikuls[i];
        logModuleDebug("btrade-slices", "btrade slice search fallback artikul", {
            index: i + 1,
            total: missingArtikuls.length,
            artikul,
        });
        try {
            const result = await getSharikStockData(artikul);
            if (result) {
                fromSearch[artikul] = {
                    price: result.price,
                    quantity: result.quantity,
                };
            }
        }
        catch (err) {
            logModuleError("btrade-slices", err, "btrade slice search fallback failed", {
                artikul,
            });
        }
        if (i < missingArtikuls.length - 1) {
            await delay(jitterMs(JITTER_MIN_MS, JITTER_MAX_MS));
        }
    }
    return fromSearch;
}
