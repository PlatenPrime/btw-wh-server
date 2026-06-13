import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { safeFilePart } from "../../../../sku-reporting/utils/buildSkuSliceExcel.js";
import { SKU_EXCEL_ALL_KONKS } from "../../../../skus/constants/skuExcelKonkAll.js";
import { Sku } from "../../../../skus/models/Sku.js";
import {
  buildSkuCatalogExcelBuffer,
  type SkuCatalogExcelRow,
} from "../../../../skus/utils/buildSkuCatalogExcel.js";
import { loadKonkTitleByKonkNames } from "../../../../skus/utils/loadKonkTitleByKonkNames.js";
import type { GetKonkNewSinceExcelQuery } from "../schemas/getKonkNewSinceExcelSchema.js";

export type GetKonkNewSinceExcelResult = {
  buffer: Buffer;
  fileName: string;
};

export async function getKonkNewSinceExcelUtil(
  konkName: string,
  query: GetKonkNewSinceExcelQuery,
): Promise<GetKonkNewSinceExcelResult> {
  const since = toSliceDate(query.since);
  const isAllKonks = konkName === SKU_EXCEL_ALL_KONKS;
  const skus = await Sku.find(
    isAllKonks
      ? { createdAt: { $gte: since } }
      : { konkName, createdAt: { $gte: since } },
  )
    .sort({ createdAt: -1 })
    .lean();

  const konkTitleByName = await loadKonkTitleByKonkNames(
    skus.map((s) => s.konkName),
  );

  const rows: SkuCatalogExcelRow[] = skus.map((s) => ({
    productId: (s.productId ?? "").trim(),
    konkName: s.konkName,
    konkTitle: konkTitleByName.get(s.konkName) ?? "",
    prodName: s.prodName,
    title: s.title,
    url: s.url,
    createdAt: s.createdAt,
    isInvalid: Boolean(s.isInvalid),
  }));

  const nameBase = `sku_new_${safeFilePart(konkName)}_${since.toISOString().slice(0, 10)}`;
  return buildSkuCatalogExcelBuffer(rows, nameBase);
}
