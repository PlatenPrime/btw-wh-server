import { SkuSlice } from "../models/SkuSlice.js";
/** $objectToArray для поля data среза (Mixed / объект ключ → метрики). */
const dataAsEntryArray = { $objectToArray: { $ifNull: ["$data", {}] } };
/**
 * Оставляет в документе только `date` и `data`, суженный до одного productId.
 * Форма совместима с прежним `.select("date data").lean()`.
 */
export function sliceDataProjectForSingleProductId(productKey) {
    return {
        $project: {
            _id: 0,
            date: 1,
            data: {
                $arrayToObject: {
                    $filter: {
                        input: dataAsEntryArray,
                        as: "p",
                        cond: { $eq: ["$$p.k", productKey] },
                    },
                },
            },
        },
    };
}
/**
 * Оставляет `konkName`, `date` и `data`, отфильтрованный по списку productId (для Skugr / групп SKU).
 */
export function sliceDataProjectForProductIdList(allowedProductIds) {
    return {
        $project: {
            _id: 0,
            konkName: 1,
            date: 1,
            data: {
                $arrayToObject: {
                    $filter: {
                        input: dataAsEntryArray,
                        as: "p",
                        cond: { $in: ["$$p.k", allowedProductIds] },
                    },
                },
            },
        },
    };
}
export async function aggregateSkuSlices(pipeline) {
    return SkuSlice.aggregate(pipeline)
        .option({ allowDiskUse: true })
        .exec();
}
