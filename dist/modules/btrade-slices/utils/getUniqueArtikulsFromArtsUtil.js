import { Art } from "../../arts/models/Art.js";
/**
 * Возвращает уникальные непустые артикулы из коллекции arts (поле artikul).
 */
export async function getUniqueArtikulsFromArtsUtil() {
    const artikuls = await Art.distinct("artikul");
    return artikuls.filter((artikul) => typeof artikul === "string" && artikul.trim() !== "");
}
