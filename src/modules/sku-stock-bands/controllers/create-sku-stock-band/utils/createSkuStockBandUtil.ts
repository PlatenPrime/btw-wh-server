import { Konk } from "../../../../konks/models/Konk.js";
import { SkuStockBand, type ISkuStockBand } from "../../../models/SkuStockBand.js";
import type { CreateSkuStockBandInput } from "../schemas/createSkuStockBandSchema.js";

export type CreateSkuStockBandResult =
  { ok: true; band: ISkuStockBand } | { ok: false; code: "KONK_NOT_FOUND"; message: string };

export async function createSkuStockBandUtil(
  input: CreateSkuStockBandInput,
): Promise<CreateSkuStockBandResult> {
  const konk = await Konk.findOne({ name: input.konkName }).select("name title").lean();
  if (!konk) {
    return {
      ok: false,
      code: "KONK_NOT_FOUND",
      message: `Konk not found: ${input.konkName}`,
    };
  }

  const band = await SkuStockBand.create({
    konk: { name: konk.name, title: konk.title },
    stockMin: input.stockMin,
    stockMax: input.stockMax,
    normalMax: input.normalMax,
  });

  return { ok: true, band };
}
