import { SkuStockBand, type ISkuStockBand } from "../../../models/SkuStockBand.js";

export async function deleteSkuStockBandByIdUtil(id: string): Promise<ISkuStockBand | null> {
  return SkuStockBand.findByIdAndDelete(id);
}
