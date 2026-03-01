import { AnalogSlice } from "../../../models/AnalogSlice.js";
/**
 * Возвращает документ среза по konkName и дате (начало дня UTC).
 */
export async function getAnalogSliceUtil(input) {
    const doc = await AnalogSlice.findOne({
        konkName: input.konkName,
        date: input.date,
    })
        .select("konkName date data")
        .lean();
    if (!doc)
        return null;
    return {
        konkName: doc.konkName,
        date: doc.date,
        data: doc.data,
    };
}
