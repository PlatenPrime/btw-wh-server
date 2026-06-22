import { Art } from "../../../../arts/models/Art.js";
import { Del } from "../../../models/Del.js";
import { Prod } from "../../../../prods/models/Prod.js";
const PROD_NOT_FOUND = "PROD_NOT_FOUND";
/**
 * Собирает объект artikuls для поставки: quant из quantity клиента, nameukr из коллекции arts (если найден).
 */
export const createDelUtil = async (input) => {
    const prod = await Prod.findOne({ name: input.prodName }).lean();
    if (!prod) {
        return { error: PROD_NOT_FOUND };
    }
    const rawArtikuls = input.artikuls ?? [];
    const artikulKeys = rawArtikuls.map((item) => item.artikul);
    const artikulsToSave = {};
    if (artikulKeys.length > 0) {
        const arts = await Art.find({ artikul: { $in: artikulKeys } })
            .select("artikul nameukr")
            .lean();
        const nameukrByArtikul = new Map(arts.map((a) => [a.artikul, a.nameukr]));
        for (const { artikul, quantity } of rawArtikuls) {
            const nameukr = nameukrByArtikul.get(artikul);
            artikulsToSave[artikul] =
                nameukr !== undefined && nameukr !== ""
                    ? { quant: quantity, nameukr }
                    : { quant: quantity };
        }
    }
    const del = await Del.create({
        title: input.title,
        prodName: input.prodName,
        prod: { title: prod.title, imageUrl: prod.imageUrl },
        artikuls: artikulsToSave,
    });
    return del;
};
