import { Analog } from "../../analogs/models/Analog.js";
import { getAnalogStockDataUtil } from "../../analogs/controllers/get-analog-stock/utils/getAnalogStockDataUtil.js";
import { AnalogSlice } from "../models/AnalogSlice.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
export { toSliceDate } from "../../../utils/sliceDate.js";
const DELAY_MS = 1000;
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Собирает срез по всем аналогам конкурента: сначала создаёт документ среза с пустым data,
 * затем по мере обработки каждого аналога (с паузой 5 сек) добавляет запись в data.
 * Ошибка по одному аналогу не прерывает обработку остальных.
 */
export async function runAnalogSliceForKonkUtil(konkName, date) {
    const sliceDate = toSliceDate(date);
    const analogs = await Analog.find({ konkName })
        .select("_id artikul")
        .lean();
    await AnalogSlice.findOneAndUpdate({ konkName, date: sliceDate }, { $setOnInsert: { konkName, date: sliceDate, data: {} } }, { upsert: true });
    let count = 0;
    for (let i = 0; i < analogs.length; i++) {
        const analog = analogs[i];
        const analogId = analog._id.toString();
        const artikulKey = analog.artikul?.trim();
        if (!artikulKey) {
            console.warn(`[AnalogSlice ${konkName}] пропущен аналог ${analogId}: отсутствует artikul`);
            continue;
        }
        console.log(`анализируется аналог ${artikulKey} конкурента ${konkName}`);
        try {
            const result = await getAnalogStockDataUtil(analogId);
            if (result) {
                const dataItem = {
                    stock: result.stock,
                    price: result.price,
                    artikul: artikulKey,
                };
                await AnalogSlice.findOneAndUpdate({ konkName, date: sliceDate }, { $set: { [`data.${artikulKey}`]: dataItem } });
                count += 1;
            }
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[AnalogSlice ${konkName}] ${artikulKey}: ${msg}`);
        }
        if (i < analogs.length - 1) {
            await delay(DELAY_MS);
        }
    }
    return { saved: true, count };
}
