import { getSharikStockData } from "../../../../browser/sharik/utils/getSharikStockData.js";
import { Del, IDel, IDelArtikuls } from "../../../models/Del.js";

export type UpdateDelArtikulsByDelIdResult = {
  total: number;
  updated: number;
  errors: number;
  notFound: number;
};

/**
 * Обновляет значения всех артикулов поставки данными с sharik.ua.
 * Вызывать в фоне; между запросами к sharik — задержка 100ms.
 */
export const updateDelArtikulsByDelIdUtil = async (
  delId: string
): Promise<UpdateDelArtikulsByDelIdResult> => {
  const del = await Del.findById(delId);
  if (!del) {
    throw new Error("Del not found");
  }

  const raw = del.artikuls as Record<string, unknown>;
  const artikulKeys = Object.keys(raw).filter((k) => {
    const v = raw[k];
    return (
      v &&
      typeof v === "object" &&
      "quantity" in v &&
      typeof (v as { quantity: unknown }).quantity === "number"
    );
  });
  const result: UpdateDelArtikulsByDelIdResult = {
    total: artikulKeys.length,
    updated: 0,
    errors: 0,
    notFound: 0,
  };

  const artikulsObj: IDelArtikuls = {};
  for (const k of artikulKeys) {
    const v = raw[k] as { quantity: number; nameukr?: string };
    artikulsObj[k] = { quantity: v.quantity, nameukr: v.nameukr };
  }

  for (let i = 0; i < artikulKeys.length; i++) {
    const artikul = artikulKeys[i];
    try {
      const sharikData = await getSharikStockData(artikul);
      if (!sharikData) {
        result.notFound++;
        continue;
      }
      artikulsObj[artikul] = {
        quantity: sharikData.quantity,
        nameukr: sharikData.nameukr ?? "",
      };
      result.updated++;
    } catch {
      result.errors++;
    }
    if (i < artikulKeys.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  del.artikuls = artikulsObj;
  del.markModified("artikuls");
  await del.save();
  return result;
};
