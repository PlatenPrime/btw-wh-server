import { Konk } from "../../../../konks/models/Konk.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { aggregateSkuSlices, sliceDataProjectForProductIdList, } from "../../../utils/sliceDataAggregationStages.js";
import { buildSkuSliceExcelForSkus, formatDateHeader, safeFilePart, } from "../../../utils/buildSkuSliceExcel.js";
import { buildSliceMapsByKonk, getSliceItem, loadSkugrWithOrderedSkus, uniqueKonkNamesFromSkus, } from "../../../utils/skugrReporting.js";
export async function getSkugrSliceExcelUtil(input) {
    const loaded = await loadSkugrWithOrderedSkus(input.skugrId);
    if (!loaded)
        return { ok: false };
    const { skugr, skus } = loaded;
    if (skus.length === 0)
        return { ok: false };
    const rows = skus.map((s) => ({
        title: s.title,
        url: s.url,
        productId: s.productId,
        konkName: s.konkName,
        prodName: s.prodName,
        createdAt: s.createdAt,
    }));
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
    const titles = {
        competitorTitle: (konkDoc?.title ?? "").trim(),
        producerName: (prodDoc?.title ?? "").trim(),
    };
    const { buffer } = await buildSkuSliceExcelForSkus(rows, dateFrom, dateTo, (kn, pid, d) => getSliceItem(maps, kn, pid, d), titles, {
        includeTotalsRow: true,
        totalsRowLabel: "Підсумок",
    });
    const idPart = safeFilePart(skugr._id.toString());
    const fileName = `sku_slice_skugr_${idPart}_${formatDateHeader(dateFrom)}_${formatDateHeader(dateTo)}.xlsx`;
    return { ok: true, buffer, fileName };
}
