import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { safeFilePart } from "../../../../sku-slices/utils/buildSkuSliceExcel.js";
import { Sku } from "../../../models/Sku.js";
import { buildSkuCatalogExcelBuffer, } from "../../../utils/buildSkuCatalogExcel.js";
export async function getKonkNewSinceExcelUtil(konkName, query) {
    const since = toSliceDate(query.since);
    const skus = await Sku.find({
        konkName,
        createdAt: { $gte: since },
    })
        .sort({ createdAt: -1 })
        .lean();
    const rows = skus.map((s) => ({
        productId: (s.productId ?? "").trim(),
        konkName: s.konkName,
        prodName: s.prodName,
        title: s.title,
        url: s.url,
        createdAt: s.createdAt,
        isInvalid: Boolean(s.isInvalid),
    }));
    const nameBase = `sku_new_${safeFilePart(konkName)}_${since.toISOString().slice(0, 10)}`;
    return buildSkuCatalogExcelBuffer(rows, nameBase);
}
