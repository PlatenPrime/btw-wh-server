import { getSharikStockData } from "../../browser/sharik/utils/getSharikStockData.js";
import { delay } from "../../../utils/delay.js";
import { jitterMs } from "../../../utils/jitterMs.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { BtradeSlice } from "../models/BtradeSlice.js";
import { getUniqueArtikulsFromArtsUtil } from "./getUniqueArtikulsFromArtsUtil.js";
const JITTER_MIN_MS = 200;
const JITTER_MAX_MS = 1000;
/**
 * Собирает ежедневный срез цен и остатков Btrade (Sharik) по артикулам из arts:
 * сначала создаёт документ среза с пустым data, затем по мере обработки каждого артикула
 * (с jitter-паузой 200–1000 мс) добавляет запись в data.
 * Ошибка по одному артикулу не прерывает обработку остальных.
 */
export async function calculateBtradeSlice() {
    const sliceDate = toSliceDate(new Date());
    const artikuls = await getUniqueArtikulsFromArtsUtil();
    await BtradeSlice.findOneAndUpdate({ date: sliceDate }, { $setOnInsert: { date: sliceDate, data: {} } }, { upsert: true });
    let count = 0;
    for (let i = 0; i < artikuls.length; i++) {
        const artikul = artikuls[i];
        console.log(`анализируется артикул ${i + 1} из ${artikuls.length} ${artikul} Btrade`);
        try {
            const result = await getSharikStockData(artikul);
            if (result) {
                await BtradeSlice.findOneAndUpdate({ date: sliceDate }, { $set: { [`data.${artikul}`]: { price: result.price, quantity: result.quantity } } });
                count += 1;
            }
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[BtradeSlice] ${artikul}: ${msg}`);
        }
        if (i < artikuls.length - 1) {
            await delay(jitterMs(JITTER_MIN_MS, JITTER_MAX_MS));
        }
    }
    return { saved: true, count };
}
