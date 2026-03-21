import { Sku } from "../../skus/models/Sku.js";
import { fetchGroupProductsByKonkName } from "../../browser/group-products/fetchGroupProductsByKonkName.js";
import { Skugr } from "../models/Skugr.js";
const BULK_WRITE_CHUNK_SIZE = 500;
export async function fillSkugrSkusFromBrowserUtil(skugrId, options) {
    const skugr = await Skugr.findById(skugrId).exec();
    if (!skugr) {
        return null;
    }
    const products = await fetchGroupProductsByKonkName(skugr.konkName, {
        groupUrl: skugr.url,
        ...(options?.maxPages !== undefined && { maxPages: options.maxPages }),
    });
    const byUrl = new Map();
    for (const p of products) {
        byUrl.set(p.url, p);
    }
    const deduped = [...byUrl.values()];
    const dedupedByUrl = products.length - deduped.length;
    let skippedAlreadyInGroup = 0;
    if (deduped.length === 0) {
        return {
            skugr,
            stats: {
                fetched: products.length,
                dedupedByUrl,
                skippedAlreadyInGroup: 0,
                linkedExisting: 0,
                created: 0,
            },
        };
    }
    const urls = deduped.map((row) => row.url);
    const existingSkus = await Sku.find({ url: { $in: urls } })
        .select("_id url")
        .lean()
        .exec();
    const urlToSkuId = new Map();
    for (const s of existingSkus) {
        urlToSkuId.set(s.url, s._id);
    }
    const groupSkuIdSet = new Set(skugr.skus.map((id) => id.toString()));
    const linkIds = [];
    const toInsert = [];
    for (const row of deduped) {
        const existingId = urlToSkuId.get(row.url);
        if (existingId) {
            if (groupSkuIdSet.has(existingId.toString())) {
                skippedAlreadyInGroup += 1;
            }
            else {
                linkIds.push(existingId);
            }
        }
        else {
            toInsert.push({
                konkName: skugr.konkName,
                prodName: skugr.prodName,
                title: row.title,
                url: row.url,
                imageUrl: row.imageUrl,
            });
        }
    }
    const insertedIds = [];
    for (let i = 0; i < toInsert.length; i += BULK_WRITE_CHUNK_SIZE) {
        const chunk = toInsert.slice(i, i + BULK_WRITE_CHUNK_SIZE);
        const operations = chunk.map((doc) => ({
            insertOne: { document: doc },
        }));
        const result = await Sku.bulkWrite(operations, { ordered: false });
        const chunkIds = Object.values(result.insertedIds);
        insertedIds.push(...chunkIds);
    }
    const combined = [...linkIds, ...insertedIds];
    if (combined.length > 0) {
        await Skugr.updateOne({ _id: skugr._id }, { $addToSet: { skus: { $each: combined } } }).exec();
    }
    const updated = await Skugr.findById(skugrId).exec();
    if (!updated) {
        return null;
    }
    return {
        skugr: updated,
        stats: {
            fetched: products.length,
            dedupedByUrl,
            skippedAlreadyInGroup,
            linkedExisting: linkIds.length,
            created: insertedIds.length,
        },
    };
}
