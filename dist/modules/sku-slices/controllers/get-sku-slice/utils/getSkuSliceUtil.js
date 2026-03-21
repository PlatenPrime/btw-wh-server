import { SkuSlice } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
export async function getSkuSliceUtil(input) {
    const sliceDate = toSliceDate(input.date);
    const doc = await SkuSlice.findOne({
        konkName: input.konkName,
        date: sliceDate,
    })
        .select("konkName date data")
        .lean();
    if (!doc)
        return null;
    return {
        konkName: doc.konkName,
        date: doc.date,
        data: (doc.data ?? {}),
    };
}
