import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { aggregateDailySkuSliceMetricsForSkus } from "../../../utils/aggregateDailySkuSliceMetricsForSkus.js";
import { loadSkugrWithOrderedSkus } from "../../../utils/skugrReporting.js";
const ALL_SKUGR_GROUPS_TITLE = "Всі групи";
export async function getKonkProdSkugrGroupsSalesUtil(input) {
    const skugrs = await Skugr.find({
        konkName: input.konk,
        prodName: input.prod,
    })
        .select("_id title")
        .lean();
    if (skugrs.length === 0)
        return { ok: false };
    skugrs.sort((a, b) => {
        const titleCmp = (a.title ?? "").localeCompare(b.title ?? "");
        if (titleCmp !== 0)
            return titleCmp;
        return a._id.toString().localeCompare(b._id.toString());
    });
    const dateFrom = toSliceDate(input.dateFrom);
    const dateTo = toSliceDate(input.dateTo);
    const data = [];
    for (const row of skugrs) {
        const skugrId = row._id.toString();
        const title = (row.title ?? "").trim();
        const loaded = await loadSkugrWithOrderedSkus(skugrId);
        if (!loaded) {
            data.push({ skugrId, title, salesPcs: 0, salesUah: 0 });
            continue;
        }
        if (loaded.skus.length === 0) {
            data.push({ skugrId, title: loaded.skugr.title ?? title, salesPcs: 0, salesUah: 0 });
            continue;
        }
        const metrics = await aggregateDailySkuSliceMetricsForSkus(loaded.skus.map((s) => ({ konkName: s.konkName, productId: s.productId })), dateFrom, dateTo);
        if (!metrics.ok) {
            data.push({
                skugrId,
                title: loaded.skugr.title ?? title,
                salesPcs: 0,
                salesUah: 0,
            });
            continue;
        }
        let salesPcs = 0;
        let salesUah = 0;
        for (const day of metrics.data) {
            salesPcs += day.sales;
            salesUah += day.revenue;
        }
        salesUah = Math.round(salesUah * 100) / 100;
        data.push({
            skugrId,
            title: loaded.skugr.title ?? title,
            salesPcs,
            salesUah,
        });
    }
    const producerSkus = await Sku.find({
        konkName: input.konk,
        prodName: input.prod,
    })
        .select("konkName productId")
        .lean();
    const allSkuRows = [...new Map(producerSkus
            .map((sku) => ({
            konkName: sku.konkName,
            productId: (sku.productId ?? "").trim(),
        }))
            .filter((sku) => sku.productId !== "")
            .map((sku) => [sku.productId, sku])).values()];
    let totalSalesPcs = 0;
    let totalSalesUah = 0;
    if (allSkuRows.length > 0) {
        const allMetrics = await aggregateDailySkuSliceMetricsForSkus(allSkuRows, dateFrom, dateTo);
        if (allMetrics.ok) {
            for (const day of allMetrics.data) {
                totalSalesPcs += day.sales;
                totalSalesUah += day.revenue;
            }
        }
    }
    const all = {
        title: ALL_SKUGR_GROUPS_TITLE,
        salesPcs: totalSalesPcs,
        salesUah: Math.round(totalSalesUah * 100) / 100,
    };
    return { ok: true, data, all };
}
