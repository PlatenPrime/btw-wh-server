import { safeFilePart } from "../../../../sku-slices/utils/buildSkuSliceExcel.js";
import { SKU_EXCEL_ALL_KONKS } from "../../../constants/skuExcelKonkAll.js";
import { Sku } from "../../../models/Sku.js";
import { buildSkuCatalogExcelBuffer, } from "../../../utils/buildSkuCatalogExcel.js";
import { loadKonkTitleByKonkNames } from "../../../utils/loadKonkTitleByKonkNames.js";
export async function getKonkInvalidExcelUtil(konkName) {
    const isAllKonks = konkName === SKU_EXCEL_ALL_KONKS;
    const skus = await Sku.find(isAllKonks ? { isInvalid: true } : { konkName, isInvalid: true })
        .sort(isAllKonks ? { konkName: 1, title: 1 } : { title: 1 })
        .lean();
    const konkTitleByName = await loadKonkTitleByKonkNames(skus.map((s) => s.konkName));
    const rows = skus.map((s) => ({
        productId: (s.productId ?? "").trim(),
        konkName: s.konkName,
        konkTitle: konkTitleByName.get(s.konkName) ?? "",
        prodName: s.prodName,
        title: s.title,
        url: s.url,
        createdAt: s.createdAt,
        isInvalid: true,
    }));
    const nameBase = `sku_invalid_${safeFilePart(konkName)}`;
    return buildSkuCatalogExcelBuffer(rows, nameBase);
}
