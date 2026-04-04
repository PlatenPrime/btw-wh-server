import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
const BSON_NUMBER_TYPES = ["double", "int", "long", "decimal"];
/**
 * Критерий «невалидной» позиции для фильтра GET /api/sku-slices (isInvalid=true).
 * Держать в sync с isInvalidSkuSliceDataItem в slice-compensation.
 */
function invalidSliceEntryCondition(variableRoot) {
    const stock = variableRoot === "e" ? "$$e.v.stock" : "$entries.v.stock";
    const price = variableRoot === "e" ? "$$e.v.price" : "$entries.v.price";
    const invalidPrice = {
        $or: [
            { $not: [{ $in: [{ $type: price }, [...BSON_NUMBER_TYPES]] }] },
            { $lt: [price, 0] },
            {
                $and: [
                    { $in: [{ $type: price }, [...BSON_NUMBER_TYPES]] },
                    { $not: [{ $eq: [price, price] }] },
                ],
            },
            { $eq: [price, { $literal: Infinity }] },
            { $eq: [price, { $literal: -Infinity }] },
        ],
    };
    return {
        $or: [
            {
                $and: [{ $eq: [stock, -1] }, { $eq: [price, -1] }],
            },
            invalidPrice,
        ],
    };
}
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
                                        cond: invalidSliceEntryCondition("e"),
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
                    { $match: { $expr: invalidSliceEntryCondition("entries") } },
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
