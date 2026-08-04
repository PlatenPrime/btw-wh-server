import { getCachedSharikProductRestsMap } from "../../../../browser/sharik/utils/product-rests/index.js";
import { Art } from "../../../../arts/models/Art.js";
import { Del, IDelArtikulValue, IDelArtikuls } from "../../../models/Del.js";

export type UpdateDelArtikulsByDelIdResult = {
  total: number;
  updated: number;
  errors: number;
  notFound: number;
};

const isDelArtikulValue = (v: unknown): v is IDelArtikulValue =>
  !!v &&
  typeof v === "object" &&
  "quant" in v &&
  typeof (v as { quant: unknown }).quant === "number";

/**
 * Обновляет stock всех артикулов поставки из product_rests (actualQuantity).
 * nameukr — из Art одним bulk-запросом. quant сохраняется.
 */
export const updateDelArtikulsByDelIdUtil = async (
  delId: string
): Promise<UpdateDelArtikulsByDelIdResult> => {
  const del = await Del.findById(delId);
  if (!del) {
    throw new Error("Del not found");
  }

  const raw = del.artikuls as Record<string, unknown>;
  const artikulKeys = Object.keys(raw).filter((k) => isDelArtikulValue(raw[k]));
  const result: UpdateDelArtikulsByDelIdResult = {
    total: artikulKeys.length,
    updated: 0,
    errors: 0,
    notFound: 0,
  };

  const artikulsObj: IDelArtikuls = {};
  for (const k of artikulKeys) {
    const v = raw[k] as IDelArtikulValue;
    artikulsObj[k] = { quant: v.quant, stock: v.stock, nameukr: v.nameukr };
  }

  const productRestsMap = await getCachedSharikProductRestsMap();
  const arts = await Art.find({ artikul: { $in: artikulKeys } })
    .select("artikul nameukr")
    .lean();
  const nameukrByArtikul = new Map(
    arts.map((a) => [a.artikul, (a.nameukr ?? "").trim()] as const)
  );

  for (const artikul of artikulKeys) {
    const previous = artikulsObj[artikul];
    try {
      const row = productRestsMap.get(artikul);
      if (!row) {
        result.notFound++;
        continue;
      }
      artikulsObj[artikul] = {
        quant: previous.quant,
        stock: row.actualQuantity,
        nameukr: nameukrByArtikul.get(artikul) || previous.nameukr || "",
      };
      result.updated++;
    } catch {
      result.errors++;
    }
  }

  del.artikuls = artikulsObj;
  del.markModified("artikuls");
  await del.save();
  return result;
};
