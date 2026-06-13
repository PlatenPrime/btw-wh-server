import { Skugr } from "../../skugrs/models/Skugr.js";
import { Sku } from "../../skus/models/Sku.js";
import { isAllProd } from "./prodDisplayTitles.js";
export async function resolveKonkProdSkus(input) {
    const skugrIds = (input.skugrIds ?? []).filter((id) => id.length > 0);
    return skugrIds.length > 0
        ? resolveBySkugrIds(input, skugrIds)
        : resolveByKonkProd(input);
}
async function resolveByKonkProd(input) {
    const skuFilter = { konkName: input.konk };
    if (input.prod !== undefined && !isAllProd(input.prod)) {
        skuFilter.prodName = input.prod;
    }
    const skus = await Sku.find(skuFilter)
        .sort({ productId: 1 })
        .select("konkName prodName productId title url createdAt")
        .lean();
    if (skus.length === 0)
        return [];
    const skugrFilter = { konkName: input.konk };
    if (input.prod !== undefined && !isAllProd(input.prod)) {
        skugrFilter.prodName = input.prod;
    }
    const skugrs = await Skugr.find(skugrFilter)
        .sort({ _id: 1 })
        .select("konkName prodName title skus")
        .lean();
    const firstSkugrBySkuId = new Map();
    for (const skugr of skugrs) {
        for (const skuId of skugr.skus ?? []) {
            const key = skuId.toString();
            if (firstSkugrBySkuId.has(key))
                continue;
            firstSkugrBySkuId.set(key, skugr);
        }
    }
    const seenProductIds = new Set();
    const rows = [];
    for (const sku of skus) {
        const productId = (sku.productId ?? "").trim();
        if (!productId || seenProductIds.has(productId))
            continue;
        seenProductIds.add(productId);
        const skugr = firstSkugrBySkuId.get(sku._id.toString());
        rows.push({
            _id: sku._id,
            konkName: sku.konkName,
            prodName: sku.prodName,
            productId,
            title: sku.title,
            url: sku.url,
            createdAt: sku.createdAt,
            skugrId: skugr ? skugr._id.toString() : null,
            skugrTitle: skugr?.title ?? "",
        });
    }
    return rows;
}
async function resolveBySkugrIds(input, skugrIds) {
    const skugrFilter = {
        _id: { $in: skugrIds },
        konkName: input.konk,
    };
    if (input.prod !== undefined && !isAllProd(input.prod)) {
        skugrFilter.prodName = input.prod;
    }
    const skugrs = await Skugr.find(skugrFilter)
        .select("konkName prodName title skus")
        .lean();
    if (skugrs.length === 0)
        return [];
    const skugrById = new Map(skugrs.map((s) => [s._id.toString(), s]));
    const orderedSkugrs = [];
    const seenSkugrIds = new Set();
    for (const id of skugrIds) {
        const skugr = skugrById.get(id);
        if (!skugr || seenSkugrIds.has(id))
            continue;
        seenSkugrIds.add(id);
        orderedSkugrs.push(skugr);
    }
    if (orderedSkugrs.length === 0)
        return [];
    const skuIdToSkugr = new Map();
    const orderedSkuIds = [];
    for (const skugr of orderedSkugrs) {
        for (const skuId of skugr.skus ?? []) {
            const key = skuId.toString();
            if (skuIdToSkugr.has(key))
                continue;
            skuIdToSkugr.set(key, skugr);
            orderedSkuIds.push(skuId);
        }
    }
    if (orderedSkuIds.length === 0)
        return [];
    const skuFilter = {
        _id: { $in: orderedSkuIds },
        konkName: input.konk,
    };
    if (input.prod !== undefined && !isAllProd(input.prod)) {
        skuFilter.prodName = input.prod;
    }
    const skuDocs = await Sku.find(skuFilter)
        .select("konkName prodName productId title url createdAt")
        .lean();
    const skuById = new Map(skuDocs.map((s) => [s._id.toString(), s]));
    const seenProductIds = new Set();
    const rows = [];
    for (const skuId of orderedSkuIds) {
        const sku = skuById.get(skuId.toString());
        if (!sku)
            continue;
        const productId = (sku.productId ?? "").trim();
        if (!productId || seenProductIds.has(productId))
            continue;
        seenProductIds.add(productId);
        const skugr = skuIdToSkugr.get(skuId.toString());
        rows.push({
            _id: sku._id,
            konkName: sku.konkName,
            prodName: sku.prodName,
            productId,
            title: sku.title,
            url: sku.url,
            createdAt: sku.createdAt,
            skugrId: skugr._id.toString(),
            skugrTitle: skugr.title ?? "",
        });
    }
    return rows;
}
