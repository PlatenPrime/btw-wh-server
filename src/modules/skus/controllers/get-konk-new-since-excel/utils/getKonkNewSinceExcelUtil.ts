import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { safeFilePart } from "../../../../sku-slices/utils/buildSkuSliceExcel.js";
import { Sku } from "../../../models/Sku.js";
import {
  buildSkuCatalogExcelBuffer,
  type SkuCatalogExcelRow,
} from "../../../utils/buildSkuCatalogExcel.js";
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
  const skus = await Sku.find({
    konkName,
    createdAt: { $gte: since },
  })
    .sort({ createdAt: -1 })
    .lean();

  const rows: SkuCatalogExcelRow[] = skus.map((s) => ({
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
