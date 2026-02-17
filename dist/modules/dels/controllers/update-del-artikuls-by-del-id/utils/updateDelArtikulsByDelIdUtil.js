import { getSharikData } from "../../../../comps/utils/getSharikData.js";
import { Del } from "../../../models/Del.js";
/**
 * Обновляет значения всех артикулов поставки данными с sharik.ua.
 * Вызывать в фоне; между запросами к sharik — задержка 100ms.
 */
export const updateDelArtikulsByDelIdUtil = async (delId) => {
    const del = await Del.findById(delId);
    if (!del) {
        throw new Error("Del not found");
    }
    const raw = del.artikuls;
    const artikulKeys = Object.keys(raw).filter((k) => {
        const v = raw[k];
        return (v &&
            typeof v === "object" &&
            "quantity" in v &&
            typeof v.quantity === "number");
    });
    const result = {
        total: artikulKeys.length,
        updated: 0,
        errors: 0,
        notFound: 0,
    };
    const artikulsObj = {};
    for (const k of artikulKeys) {
        const v = raw[k];
        artikulsObj[k] = { quantity: v.quantity, nameukr: v.nameukr };
    }
    for (let i = 0; i < artikulKeys.length; i++) {
        const artikul = artikulKeys[i];
        try {
            const sharikData = await getSharikData(artikul);
            if (!sharikData) {
                result.notFound++;
                continue;
            }
            artikulsObj[artikul] = {
                quantity: sharikData.quantity,
                nameukr: sharikData.nameukr ?? "",
            };
            result.updated++;
        }
        catch {
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
