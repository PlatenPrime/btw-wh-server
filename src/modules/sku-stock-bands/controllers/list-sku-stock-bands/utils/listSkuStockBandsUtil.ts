import { SkuStockBand, type ISkuStockBand } from "../../../models/SkuStockBand.js";
import type { ListSkuStockBandsInput } from "../schemas/listSkuStockBandsSchema.js";

export async function listSkuStockBandsUtil(
  input: ListSkuStockBandsInput = {},
): Promise<ISkuStockBand[]> {
  const filter =
    input.konkName !== undefined && input.konkName.length > 0
      ? { "konk.name": input.konkName }
      : {};
  const list = await SkuStockBand.find(filter).sort({ "konk.name": 1, stockMin: 1 }).lean();
  return list as ISkuStockBand[];
}
