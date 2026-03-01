import { Analog } from "../../analogs/models/Analog.js";
/**
 * Возвращает уникальные непустые артикулы из коллекции analogs (поле artikul).
 */
export async function getUniqueArtikulsFromAnalogsUtil() {
    const artikuls = await Analog.distinct("artikul");
    return artikuls.filter((a) => typeof a === "string" && a.trim() !== "");
}
