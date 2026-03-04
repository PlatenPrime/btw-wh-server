import { Analog } from "../../../../analogs/models/Analog.js";
import { Art } from "../../../../arts/models/Art.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { BtradeSlice } from "../../../../btrade-slices/models/BtradeSlice.js";
import { AnalogSlice } from "../../../models/AnalogSlice.js";
import { toSliceDate } from "../../../utils/runAnalogSliceForKonkUtil.js";
/**
 * Возвращает массив данных сравнения срезов по аналогу и Btrade за период дат.
 * Для каждой даты в диапазоне (dateFrom..dateTo, включая границы) добавляется запись,
 * если есть данные хотя бы у конкурента, либо у Btrade.
 *
 * ok: false — аналог не найден или у аналога пустой artikul.
 */
export async function getAnalogBtradeComparisonRangeUtil(input) {
    const analog = await Analog.findById(input.analogId)
        .select("konkName artikul prodName")
        .lean();
    if (!analog)
        return { ok: false };
    const artikulKey = analog.artikul?.trim();
    if (!artikulKey)
        return { ok: false };
    const dateFrom = toSliceDate(input.dateFrom);
    const dateTo = toSliceDate(input.dateTo);
    const artDoc = await Art.findOne({ artikul: artikulKey })
        .select("nameukr")
        .lean();
    const artNameUkr = (artDoc?.nameukr ?? "").trim() || null;
    const prodDoc = await Prod.findOne({ name: analog.prodName })
        .select("title")
        .lean();
    const producerName = (prodDoc?.title ?? "").trim() || null;
    // Загружаем документы срезов конкурента за диапазон
    const analogDocs = await AnalogSlice.find({
        konkName: analog.konkName,
        date: { $gte: dateFrom, $lte: dateTo },
    })
        .select("date data")
        .lean();
    const analogByDate = new Map();
    for (const doc of analogDocs) {
        const normalizedDate = toSliceDate(doc.date);
        const dataRecord = (doc.data ?? {});
        const item = dataRecord[artikulKey];
        if (!item)
            continue;
        analogByDate.set(normalizedDate.getTime(), item);
    }
    // Загружаем документы срезов Btrade за диапазон
    const btradeDocs = await BtradeSlice.find({
        date: { $gte: dateFrom, $lte: dateTo },
    })
        .select("date data")
        .lean();
    const btradeByDate = new Map();
    for (const doc of btradeDocs) {
        const normalizedDate = toSliceDate(doc.date);
        const dataRecord = (doc.data ?? {});
        const item = dataRecord[artikulKey];
        if (!item)
            continue;
        btradeByDate.set(normalizedDate.getTime(), item);
    }
    const data = [];
    const cursor = new Date(dateFrom);
    while (cursor.getTime() <= dateTo.getTime()) {
        const key = cursor.getTime();
        const analogItem = analogByDate.get(key);
        const btradeItem = btradeByDate.get(key);
        data.push({
            date: new Date(cursor),
            analogStock: analogItem?.stock ?? null,
            analogPrice: analogItem?.price ?? null,
            btradeStock: btradeItem?.quantity ?? null,
            btradePrice: btradeItem?.price ?? null,
        });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return { ok: true, data, artikul: artikulKey, artNameUkr, producerName };
}
