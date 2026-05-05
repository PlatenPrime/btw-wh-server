import { applyRecountDayToSales, computeRevenueForDay, computeSalesFromStockSequence, } from "../../../../analog-slices/controllers/common/salesComparisonUtils.js";
import { Konk } from "../../../../konks/models/Konk.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { coalesceSkuSliceItemsAlongDates, sliceDateMinusDays, } from "../../../utils/coalesceSkuSliceItemsForReporting.js";
import { aggregateSkuSlices, sliceDataProjectForProductIdList, } from "../../../utils/sliceDataAggregationStages.js";
import { resolveKonkProdSkus } from "../../../utils/resolveKonkProdSkus.js";
import { enumerateReportingDates } from "../../../utils/skugrReporting.js";
const ALL_MANUFACTURERS_TITLE = "Всі виробники";
export async function getKonkProdManufacturersPieDataUtil(input) {
    const dateFrom = toSliceDate(input.dateFrom);
    const dateTo = toSliceDate(input.dateTo);
    const warmupStart = sliceDateMinusDays(dateFrom, 1);
    const skugrIds = (input.skugrIds ?? []).filter((s) => s.length > 0);
    const productToManufacturer = new Map();
    if (skugrIds.length > 0) {
        const resolved = await resolveKonkProdSkus({
            konk: input.konk,
            skugrIds,
        });
        for (const r of resolved) {
            const productId = (r.productId ?? "").trim();
            const prodName = (r.prodName ?? "").trim();
            if (!productId || !prodName)
                continue;
            productToManufacturer.set(productId, prodName);
        }
    }
    else {
        const skuDocs = await Sku.find({ konkName: input.konk })
            .select("productId prodName")
            .lean();
        for (const doc of skuDocs) {
            const productId = (doc.productId ?? "").trim();
            const prodName = (doc.prodName ?? "").trim();
            if (!productId || !prodName)
                continue;
            productToManufacturer.set(productId, prodName);
        }
    }
    const productIds = [...productToManufacturer.keys()];
    if (productIds.length === 0)
        return { ok: false };
    const manufacturerNames = [...new Set(productToManufacturer.values())];
    const konkDoc = await Konk.findOne({ name: input.konk }).select("recountDays").lean();
    const recountDays = new Set((konkDoc?.recountDays ?? []).map(String));
    const prodDocs = await Prod.find({ name: { $in: manufacturerNames } })
        .select("name title")
        .lean();
    const prodTitleByName = new Map();
    for (const prodDoc of prodDocs) {
        const name = (prodDoc.name ?? "").trim();
        const title = (prodDoc.title ?? "").trim();
        if (!name || !title)
            continue;
        prodTitleByName.set(name, title);
    }
    const sliceRows = await aggregateSkuSlices([
        {
            $match: {
                konkName: input.konk,
                date: { $gte: warmupStart, $lte: dateTo },
            },
        },
        { $sort: { date: 1 } },
        sliceDataProjectForProductIdList(productIds),
    ]);
    const datesFull = enumerateReportingDates(warmupStart, dateTo);
    const indexStart = datesFull.findIndex((d) => toSliceDate(d).getTime() >= dateFrom.getTime());
    if (indexStart < 0 || indexStart >= datesFull.length)
        return { ok: false };
    const byDate = new Map();
    for (const row of sliceRows) {
        const dateKey = toSliceDate(row.date).getTime();
        byDate.set(dateKey, (row.data ?? {}));
    }
    const result = {};
    for (const productId of productIds) {
        const manufacturer = productToManufacturer.get(productId);
        if (!manufacturer)
            continue;
        const coalesced = coalesceSkuSliceItemsAlongDates(datesFull, (date) => {
            const row = byDate.get(toSliceDate(date).getTime());
            const item = row?.[productId];
            return item
                ? {
                    stock: typeof item.stock === "number" && Number.isFinite(item.stock)
                        ? item.stock
                        : -1,
                    price: typeof item.price === "number" && Number.isFinite(item.price)
                        ? item.price
                        : -1,
                }
                : null;
        });
        const salesSequence = computeSalesFromStockSequence(coalesced.map((item) => item.stock));
        let salesPcs = 0;
        let salesUah = 0;
        for (let i = indexStart; i < datesFull.length; i++) {
            const date = datesFull[i];
            const salesRaw = salesSequence[i]?.sales ?? 0;
            const sales = applyRecountDayToSales(salesRaw, date, recountDays);
            salesPcs += sales;
            salesUah += computeRevenueForDay(sales, coalesced[i]?.price ?? null);
        }
        if (!result[manufacturer]) {
            result[manufacturer] = {
                title: prodTitleByName.get(manufacturer) ?? manufacturer,
                salesPcs: 0,
                salesUah: 0,
            };
        }
        result[manufacturer].salesPcs += salesPcs;
        result[manufacturer].salesUah += salesUah;
    }
    for (const key of Object.keys(result)) {
        const item = result[key];
        item.salesUah = Math.round(item.salesUah * 100) / 100;
    }
    if (Object.keys(result).length === 0)
        return { ok: false };
    let totalPcs = 0;
    let totalUah = 0;
    for (const item of Object.values(result)) {
        totalPcs += item.salesPcs;
        totalUah += item.salesUah;
    }
    const all = {
        title: ALL_MANUFACTURERS_TITLE,
        salesPcs: totalPcs,
        salesUah: Math.round(totalUah * 100) / 100,
    };
    return { ok: true, data: result, all };
}
