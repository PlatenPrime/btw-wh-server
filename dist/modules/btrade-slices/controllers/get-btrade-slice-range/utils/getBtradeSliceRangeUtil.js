import { Art } from "../../../../arts/models/Art.js";
import { aggregateBtradeSlices, sliceDataProjectForArtikulList, } from "../../../utils/btradeSliceAggregationStages.js";
import { mapBtradeSliceDocsToRangeItems } from "../../../utils/mapBtradeSliceDocsToRangeItems.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
export async function getBtradeSliceRangeUtil(input) {
    const artikulKey = input.artikul.trim();
    const art = await Art.findOne({ artikul: artikulKey }).select("_id").lean();
    if (!art)
        return { ok: false };
    const dateFrom = toSliceDate(input.dateFrom);
    const dateTo = toSliceDate(input.dateTo);
    const docs = await aggregateBtradeSlices([
        {
            $match: {
                date: { $gte: dateFrom, $lte: dateTo },
            },
        },
        { $sort: { date: 1 } },
        sliceDataProjectForArtikulList([artikulKey]),
    ]);
    return { ok: true, data: mapBtradeSliceDocsToRangeItems(docs, artikulKey) };
}
