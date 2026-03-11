import { Analog } from "../../../../analogs/models/Analog.js";
import { AnalogSlice } from "../../../models/AnalogSlice.js";
import { computeRevenueForDay, computeSalesFromStockSequence, } from "../../common/salesComparisonUtils.js";
import { toSliceDate } from "../../../utils/runAnalogSliceForKonkUtil.js";
/**
 * Возвращает продажи и выручку по аналогу на конкретную дату.
 * Продажи = разница остатка с предыдущим днём (stock(prev) - stock(curr)); при отсутствии предыдущего или росте остатка — 0.
 * Выручка = продажи × цена на дату.
 * null — аналог не найден, пустой artikul или нет среза/записи на запрошенную дату.
 */
export async function getAnalogSalesByDateUtil(input) {
    const analog = await Analog.findById(input.analogId)
        .select("konkName artikul")
        .lean();
    if (!analog)
        return null;
    const artikulKey = analog.artikul?.trim();
    if (!artikulKey)
        return null;
    const sliceDate = toSliceDate(input.date);
    const prevDate = new Date(sliceDate);
    prevDate.setUTCDate(prevDate.getUTCDate() - 1);
    const [currDoc, prevDoc] = await Promise.all([
        AnalogSlice.findOne({
            konkName: analog.konkName,
            date: sliceDate,
        })
            .select("data")
            .lean(),
        AnalogSlice.findOne({
            konkName: analog.konkName,
            date: prevDate,
        })
            .select("data")
            .lean(),
    ]);
    const currData = (currDoc?.data ?? {});
    const currItem = currData[artikulKey];
    if (!currItem)
        return null;
    const prevData = (prevDoc?.data ?? {});
    const prevItem = prevData[artikulKey];
    const prevStock = prevItem != null ? prevItem.stock : null;
    const currStock = currItem.stock;
    const stockByDay = [prevStock, currStock];
    const salesResults = computeSalesFromStockSequence(stockByDay);
    const dayResult = salesResults[1];
    const revenue = computeRevenueForDay(dayResult.sales, currItem.price);
    return {
        sales: dayResult.sales,
        revenue,
        price: currItem.price,
        isDeliveryDay: dayResult.isDeliveryDay,
    };
}
