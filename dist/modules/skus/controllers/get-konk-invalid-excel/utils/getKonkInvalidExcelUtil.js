import { safeFilePart } from "../../../../sku-slices/utils/buildSkuSliceExcel.js";
import { Sku } from "../../../models/Sku.js";
import { buildSkuCatalogExcelBuffer, } from "../../../utils/buildSkuCatalogExcel.js";
export async function getKonkInvalidExcelUtil(konkName) {
    const skus = await Sku.find({ konkName, isInvalid: true })
        .sort({ title: 1 })
        .lean();
    const rows = skus.map((s) => ({
        productId: (s.productId ?? "").trim(),
        konkName: s.konkName,
        prodName: s.prodName,
        title: s.title,
        url: s.url,
        createdAt: s.createdAt,
        isInvalid: true,
    }));
    const nameBase = `sku_invalid_${safeFilePart(konkName)}`;
    return buildSkuCatalogExcelBuffer(rows, nameBase);
}
