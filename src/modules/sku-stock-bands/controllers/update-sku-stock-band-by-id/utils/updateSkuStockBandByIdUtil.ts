import { Konk } from "../../../../konks/models/Konk.js";
import { SkuStockBand, type ISkuStockBand } from "../../../models/SkuStockBand.js";
import type { UpdateSkuStockBandByIdInput } from "../schemas/updateSkuStockBandByIdSchema.js";

export type UpdateSkuStockBandByIdResult =
  | { ok: true; band: ISkuStockBand }
  | { ok: false; code: "NOT_FOUND" | "KONK_NOT_FOUND" | "INVALID_BOUNDS"; message: string };

export async function updateSkuStockBandByIdUtil(
  input: UpdateSkuStockBandByIdInput,
): Promise<UpdateSkuStockBandByIdResult> {
  const existing = await SkuStockBand.findById(input.id);
  if (!existing) {
    return { ok: false, code: "NOT_FOUND", message: "Sku stock band not found" };
  }

  const nextStockMin = input.stockMin ?? existing.stockMin;
  const nextStockMax = input.stockMax ?? existing.stockMax;
  const nextNormalMax = input.normalMax ?? existing.normalMax;

  if (nextStockMin > nextStockMax) {
    return {
      ok: false,
      code: "INVALID_BOUNDS",
      message: "stockMin must be less than or equal to stockMax",
    };
  }
  if (!(nextNormalMax < nextStockMin)) {
    return {
      ok: false,
      code: "INVALID_BOUNDS",
      message: "normalMax must be less than stockMin",
    };
  }

  if (input.konkName !== undefined) {
    const konk = await Konk.findOne({ name: input.konkName }).select("name title").lean();
    if (!konk) {
      return {
        ok: false,
        code: "KONK_NOT_FOUND",
        message: `Konk not found: ${input.konkName}`,
      };
    }
    existing.konk = { name: konk.name, title: konk.title };
  }

  existing.stockMin = nextStockMin;
  existing.stockMax = nextStockMax;
  existing.normalMax = nextNormalMax;

  await existing.save();
  return { ok: true, band: existing };
}
