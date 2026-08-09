import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { aggregatePeriodSkuSliceMetricsForSkus } from "../../../../sku-reporting/utils/aggregatePeriodSkuSliceMetricsForSkus.js";
import { loadSkugrWithOrderedSkus } from "../../../../sku-reporting/utils/skugrReporting.js";
const ALL_SKUS_TITLE = "Усього";
export async function getSkugrSkusSalesUtil(input) {
    const loaded = await loadSkugrWithOrderedSkus(input.skugrId);
    if (!loaded)
        return { ok: false };
    const { skugr, skus } = loaded;
    const skugrTitle = (skugr.title ?? "").trim();
    if (skus.length === 0) {
        return {
            ok: true,
            skugrTitle,
            data: [],
            all: {
                title: ALL_SKUS_TITLE,
                salesPcs: 0,
                salesUah: 0,
            },
        };
    }
    const dateFrom = toSliceDate(input.dateFrom);
    const dateTo = toSliceDate(input.dateTo);
    const metrics = await aggregatePeriodSkuSliceMetricsForSkus(skus.map((s) => ({ konkName: s.konkName, productId: s.productId })), dateFrom, dateTo);
    if (!metrics.ok) {
        return {
            ok: true,
            skugrTitle,
            data: skus.map((s) => ({
                skuId: s._id.toString(),
                title: s.title ?? "",
                productId: s.productId,
                imageUrl: s.imageUrl ?? "",
                salesPcs: 0,
                salesUah: 0,
            })),
            all: {
                title: ALL_SKUS_TITLE,
                salesPcs: 0,
                salesUah: 0,
            },
        };
    }
    const data = skus.map((s, i) => {
        const row = metrics.data[i];
        return {
            skuId: s._id.toString(),
            title: s.title ?? "",
            productId: s.productId,
            imageUrl: s.imageUrl ?? "",
            salesPcs: row.salesPcs,
            salesUah: row.salesUah,
        };
    });
    let totalSalesPcs = 0;
    let totalSalesUah = 0;
    for (const row of data) {
        totalSalesPcs += row.salesPcs;
        totalSalesUah += row.salesUah;
    }
    return {
        ok: true,
        skugrTitle,
        data,
        all: {
            title: ALL_SKUS_TITLE,
            salesPcs: totalSalesPcs,
            salesUah: Math.round(totalSalesUah * 100) / 100,
        },
    };
}
