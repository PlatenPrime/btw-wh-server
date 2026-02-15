import { getSharikData } from "../../../../comps/utils/getSharikData.js";
import { Del, IDel } from "../../../models/Del.js";

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
  const artikulKeys = Object.keys(raw).filter(
    (k) => typeof raw[k] === "number"
  );
  const result: UpdateDelArtikulsByDelIdResult = {
    total: artikulKeys.length,
    updated: 0,
    errors: 0,
    notFound: 0,
  };

  const artikulsObj = { ...(del.artikuls as Record<string, number>) };

  for (let i = 0; i < artikulKeys.length; i++) {
    const artikul = artikulKeys[i];
    try {
      const sharikData = await getSharikData(artikul);
      if (!sharikData) {
        result.notFound++;
        continue;
      }
      artikulsObj[artikul] = sharikData.quantity;
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
