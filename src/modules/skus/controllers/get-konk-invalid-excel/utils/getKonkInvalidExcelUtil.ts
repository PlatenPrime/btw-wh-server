import { safeFilePart } from "../../../../sku-slices/utils/buildSkuSliceExcel.js";
import { Sku } from "../../../models/Sku.js";
import {
  buildSkuCatalogExcelBuffer,
  type SkuCatalogExcelRow,
} from "../../../utils/buildSkuCatalogExcel.js";

export type GetKonkInvalidExcelResult = {
  buffer: Buffer;
  fileName: string;
};

export async function getKonkInvalidExcelUtil(
  konkName: string,
): Promise<GetKonkInvalidExcelResult> {
  const skus = await Sku.find({ konkName, isInvalid: true })
    .sort({ title: 1 })
    .lean();

  const rows: SkuCatalogExcelRow[] = skus.map((s) => ({
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
