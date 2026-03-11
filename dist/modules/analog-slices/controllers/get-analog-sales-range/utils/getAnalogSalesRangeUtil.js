import { Analog } from "../../../../analogs/models/Analog.js";
import { AnalogSlice } from "../../../models/AnalogSlice.js";
import { computeRevenueForDay, computeSalesFromStockSequence, } from "../../common/salesComparisonUtils.js";
import { toSliceDate } from "../../../utils/runAnalogSliceForKonkUtil.js";
/**
 * Возвращает массив продаж и выручки по аналогу за период дат (для графиков).
 * Каждый элемент: { date: ISO string, sales, revenue, price, isDeliveryDay }. Сортировка по date по возрастанию.
 * Продажи = разница остатка с предыдущим днём; выручка = продажи × цена.
 * ok: false — аналог не найден или у аналога пустой artikul.
 */
export async function getAnalogSalesRangeUtil(input) {
    const analog = await Analog.findById(input.analogId)
        .select("konkName artikul")
        .lean();
    if (!analog)
        return { ok: false };
    const artikulKey = analog.artikul?.trim();
    if (!artikulKey)
        return { ok: false };
    const dateFrom = toSliceDate(input.dateFrom);
    const dateTo = toSliceDate(input.dateTo);
    const docs = await AnalogSlice.find({
        konkName: analog.konkName,
        date: { $gte: dateFrom, $lte: dateTo },
    })
        .select("date data")
        .sort({ date: 1 })
        .lean();
    const sliceItems = [];
    for (const doc of docs) {
        const dataRecord = (doc.data ?? {});
        const item = dataRecord[artikulKey];
        if (!item)
            continue;
        sliceItems.push({
            date: doc.date.toISOString(),
            stock: item.stock,
            price: item.price,
        });
    }
    const stockByDay = sliceItems.map((d) => d.stock);
    const salesResults = computeSalesFromStockSequence(stockByDay);
    const data = sliceItems.map((d, i) => {
        const dayResult = salesResults[i];
        const revenue = computeRevenueForDay(dayResult.sales, d.price);
        return {
            date: d.date,
            sales: dayResult.sales,
            revenue,
            price: d.price,
            isDeliveryDay: dayResult.isDeliveryDay,
        };
    });
    return { ok: true, data };
}
