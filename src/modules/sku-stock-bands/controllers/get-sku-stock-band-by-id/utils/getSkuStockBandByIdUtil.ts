import { SkuStockBand, type ISkuStockBand } from "../../../models/SkuStockBand.js";

export async function getSkuStockBandByIdUtil(id: string): Promise<ISkuStockBand | null> {
  return SkuStockBand.findById(id);
}
