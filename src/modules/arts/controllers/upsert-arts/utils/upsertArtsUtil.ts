import { Art } from "../../../models/Art.js";
import { generateMarkerUtil } from "../../../utils/generateMarkerUtil.js";
import { UpsertArtsInput } from "../schemas/upsertArtsSchema.js";

type UpsertArtsUtilInput = {
  arts: UpsertArtsInput;
};

export const upsertArtsUtil = async ({ arts }: UpsertArtsUtilInput) => {
  // Генерируем текущий маркер один раз для всех артикулов
  const currentMarker = generateMarkerUtil();

  const operations = arts.map((art) => {
    // Если маркер не передан явно, используем автоматически сгенерированный
    const marker = art.marker !== undefined && art.marker !== null 
      ? art.marker 
      : currentMarker;

    return {
      updateOne: {
        filter: { artikul: art.artikul },
        update: {
          $set: {
            zone: art.zone,
            namerus: art.namerus,
            nameukr: art.nameukr,
            ...(art.limit !== undefined && art.limit !== null && { limit: art.limit }),
            marker: marker,
          },
        },
        upsert: true,
      },
    };
  });

  const result = await Art.bulkWrite(operations);
  return result;
};

