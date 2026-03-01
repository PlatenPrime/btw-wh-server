import { BtradeSlice } from "../../../models/BtradeSlice.js";
/**
 * Возвращает документ среза Btrade по дате (начало дня UTC).
 */
export async function getBtradeSliceUtil(input) {
    const doc = await BtradeSlice.findOne({ date: input.date })
        .select("date data")
        .lean();
    if (!doc)
        return null;
    return {
        date: doc.date,
        data: doc.data,
    };
}
