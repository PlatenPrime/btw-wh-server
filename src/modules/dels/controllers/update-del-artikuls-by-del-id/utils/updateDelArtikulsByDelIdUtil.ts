import { getSharikStockData } from "../../../../browser/sharik/utils/getSharikStockData.js";
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
 * Обновляет stock всех артикулов поставки данными с sharik.ua.
 * quant и существующий stock (при ошибке/notFound) сохраняются.
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

  for (let i = 0; i < artikulKeys.length; i++) {
    const artikul = artikulKeys[i];
    const previous = artikulsObj[artikul];
    try {
      const sharikData = await getSharikStockData(artikul);
      if (!sharikData) {
        result.notFound++;
        continue;
      }
      artikulsObj[artikul] = {
        quant: previous.quant,
        stock: sharikData.quantity,
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
