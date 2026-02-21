import { Art } from "../../../../arts/models/Art.js";
import { Del, IDel, IDelArtikuls } from "../../../models/Del.js";
import { Prod } from "../../../../prods/models/Prod.js";

const PROD_NOT_FOUND = "PROD_NOT_FOUND" as const;

type CreateDelUtilInput = {
  title: string;
  prodName: string;
  artikuls: Record<string, number>;
};

export type CreateDelUtilResult = IDel | { error: typeof PROD_NOT_FOUND };

/**
 * Собирает объект artikuls для поставки: для каждого артикула подставляет nameukr из коллекции arts (если найден).
 */
export const createDelUtil = async (
  input: CreateDelUtilInput
): Promise<CreateDelUtilResult> => {
  const prod = await Prod.findOne({ name: input.prodName }).lean();
  if (!prod) {
    return { error: PROD_NOT_FOUND };
  }

  const rawArtikuls = input.artikuls ?? {};
  const artikulKeys = Object.keys(rawArtikuls);
  const artikulsToSave: IDelArtikuls = {};

  if (artikulKeys.length > 0) {
    const arts = await Art.find({ artikul: { $in: artikulKeys } })
      .select("artikul nameukr")
      .lean();
    const nameukrByArtikul = new Map(
      arts.map((a) => [a.artikul, a.nameukr] as const)
    );

    for (const artikul of artikulKeys) {
      const quantity = rawArtikuls[artikul];
      const nameukr = nameukrByArtikul.get(artikul);
      artikulsToSave[artikul] =
        nameukr !== undefined && nameukr !== ""
          ? { quantity, nameukr }
          : { quantity };
    }
  }

  const del = await Del.create({
    title: input.title,
    prodName: input.prodName,
    artikuls: artikulsToSave,
  });
  return del;
};
