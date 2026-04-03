import { Konk } from "../../../../konks/models/Konk.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { aggregateSkuSlices, sliceDataProjectForProductIdList, } from "../../../utils/sliceDataAggregationStages.js";
import { formatDateHeader, safeFilePart, } from "../../../utils/buildSkuSliceExcel.js";
import { buildSliceMapsByKonk, getSliceItem, loadSkugrWithOrderedSkus, uniqueKonkNamesFromSkus, } from "../../../utils/skugrReporting.js";
import { buildSkuSalesExcelForSkus, } from "../../get-sku-sales-excel/utils/buildSkuSalesExcel.js";
export async function getSkugrSalesExcelUtil(input) {
    const loaded = await loadSkugrWithOrderedSkus(input.skugrId);
    if (!loaded)
        return { ok: false };
    const { skugr, skus } = loaded;
    if (skus.length === 0)
        return { ok: false };
    const dateFrom = toSliceDate(input.dateFrom);
    const dateTo = toSliceDate(input.dateTo);
    const allowedProductIds = [...new Set(skus.map((s) => s.productId))];
    const slices = await aggregateSkuSlices([
        {
            $match: {
                konkName: { $in: uniqueKonkNamesFromSkus(skus) },
                date: { $gte: dateFrom, $lte: dateTo },
            },
        },
        sliceDataProjectForProductIdList(allowedProductIds),
    ]);
    const maps = buildSliceMapsByKonk(slices);
    const [konkDoc, prodDoc] = await Promise.all([
        Konk.findOne({ name: skugr.konkName }).select("title").lean(),
        Prod.findOne({ name: skugr.prodName }).select("title").lean(),
    ]);
    const competitorTitle = (konkDoc?.title ?? "").trim();
    const producerName = (prodDoc?.title ?? "").trim();
    const rows = skus.map((sku) => ({
        title: sku.title,
        url: sku.url,
        productId: sku.productId,
        konkName: sku.konkName,
        competitorTitle,
        producerName,
    }));
    const { buffer } = await buildSkuSalesExcelForSkus(rows, dateFrom, dateTo, (kn, pid, d) => getSliceItem(maps, kn, pid, d), {
        summaryMode: "bottomOnly",
        summarySalesLabel: "Загальні продажі, шт",
        summaryRevenueLabel: "Загальна виручка, грн",
    });
    const idPart = safeFilePart(skugr._id.toString());
    const fileName = `sku_sales_skugr_${idPart}_${formatDateHeader(dateFrom)}_${formatDateHeader(dateTo)}.xlsx`;
    return { ok: true, buffer, fileName };
}
