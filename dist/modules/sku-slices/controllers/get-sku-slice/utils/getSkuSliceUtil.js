import { invalidSliceEntryMongoCondition } from "../../../../slices/utils/invalidSliceEntryMongoCondition.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
const dataEntriesArray = {
    $objectToArray: { $ifNull: ["$data", {}] },
};
function buildSlicePagePipeline(konkName, sliceDate, skip, limit) {
    return [
        { $match: { konkName, date: sliceDate } },
        {
            $facet: {
                meta: [
                    {
                        $project: {
                            _id: 0,
                            konkName: 1,
                            date: 1,
                            total: {
                                $size: dataEntriesArray,
                            },
                        },
                    },
                ],
                rows: [
                    {
                        $project: {
                            entries: dataEntriesArray,
                        },
                    },
                    { $unwind: "$entries" },
                    { $sort: { "entries.k": 1 } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 0,
                            productId: "$entries.k",
                            stock: "$entries.v.stock",
                            price: "$entries.v.price",
                        },
                    },
                ],
            },
        },
    ];
}
function buildInvalidSlicePagePipeline(konkName, sliceDate, skip, limit) {
    return [
        { $match: { konkName, date: sliceDate } },
        {
            $facet: {
                meta: [
                    {
                        $project: {
                            _id: 0,
                            konkName: 1,
                            date: 1,
                            total: {
                                $size: {
                                    $filter: {
                                        input: dataEntriesArray,
                                        as: "e",
                                        cond: invalidSliceEntryMongoCondition("e", "stock"),
                                    },
                                },
                            },
                        },
                    },
                ],
                rows: [
                    {
                        $project: {
                            entries: dataEntriesArray,
                        },
                    },
                    { $unwind: "$entries" },
                    {
                        $match: {
                            $expr: invalidSliceEntryMongoCondition("entries", "stock"),
                        },
                    },
                    { $sort: { "entries.k": 1 } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 0,
                            productId: "$entries.k",
                            stock: "$entries.v.stock",
                            price: "$entries.v.price",
                        },
                    },
                ],
            },
        },
    ];
}
export async function getSkuSliceUtil(input) {
    const { page, limit } = input;
    const sliceDate = toSliceDate(input.date);
    const skip = (page - 1) * limit;
    const pipeline = input.isInvalid
        ? buildInvalidSlicePagePipeline(input.konkName, sliceDate, skip, limit)
        : buildSlicePagePipeline(input.konkName, sliceDate, skip, limit);
    const aggResult = await SkuSlice.aggregate(pipeline)
        .option({ allowDiskUse: true })
        .exec();
    const bucket = aggResult[0];
    if (!bucket)
        return null;
    const meta = bucket.meta[0];
    if (!meta)
        return null;
    const { konkName, date, total } = meta;
    const rows = bucket.rows ?? [];
    const productIds = rows.map((r) => r.productId);
    const skus = productIds.length > 0
        ? (await Sku.find({ productId: { $in: productIds } })
            .lean()
            .exec())
        : [];
    const skuByProductId = new Map();
    for (const sku of skus) {
        skuByProductId.set(sku.productId, sku);
    }
    const items = rows.map((row) => ({
        productId: row.productId,
        stock: row.stock,
        price: row.price,
        sku: skuByProductId.get(row.productId) ?? null,
    }));
    const totalPages = Math.ceil(total / limit) || 0;
    return {
        konkName,
        date,
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}
