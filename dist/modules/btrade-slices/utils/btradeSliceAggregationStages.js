import { BtradeSlice } from "../models/BtradeSlice.js";
const dataAsEntryArray = { $objectToArray: { $ifNull: ["$data", {}] } };
/**
 * Проекция `data` среза Btrade только по списку артикулов (меньше трафика из Mongo).
 */
export function sliceDataProjectForArtikulList(allowedArtikuls) {
    return {
        $project: {
            _id: 0,
            date: 1,
            data: {
                $arrayToObject: {
                    $filter: {
                        input: dataAsEntryArray,
                        as: "p",
                        cond: { $in: ["$$p.k", allowedArtikuls] },
                    },
                },
            },
        },
    };
}
export async function aggregateBtradeSlices(pipeline) {
    return BtradeSlice.aggregate(pipeline)
        .option({ allowDiskUse: true })
        .exec();
}
