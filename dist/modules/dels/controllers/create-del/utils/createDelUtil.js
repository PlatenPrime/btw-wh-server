import { Art } from "../../../../arts/models/Art.js";
import { Del } from "../../../models/Del.js";
/**
 * Собирает объект artikuls для поставки: для каждого артикула подставляет nameukr из коллекции arts (если найден).
 */
export const createDelUtil = async (input) => {
    const rawArtikuls = input.artikuls ?? {};
    const artikulKeys = Object.keys(rawArtikuls);
    const artikulsToSave = {};
    if (artikulKeys.length > 0) {
        const arts = await Art.find({ artikul: { $in: artikulKeys } })
            .select("artikul nameukr")
            .lean();
        const nameukrByArtikul = new Map(arts.map((a) => [a.artikul, a.nameukr]));
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
        artikuls: artikulsToSave,
    });
    return del;
};
