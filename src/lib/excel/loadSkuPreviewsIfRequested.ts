import type { ExcelBuildProgressHandler } from "./excelBuildProgress.js";
import { loadSkuPreviewJpegs, type SkuPreviewJpeg } from "./loadSkuPreviewJpegs.js";

export async function loadSkuPreviewsIfRequested(
  includeImages: boolean,
  rows: readonly { skuId: string; imageUrl: string }[],
  onProgress?: ExcelBuildProgressHandler,
): Promise<Map<string, SkuPreviewJpeg>> {
  if (!includeImages) return new Map();
  return loadSkuPreviewJpegs(rows, {
    onBatch: (done, total) => onProgress?.(done, total),
  });
}
