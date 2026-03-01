import { Analog } from "../../analogs/models/Analog.js";

/**
 * Возвращает уникальные непустые артикулы из коллекции analogs (поле artikul).
 */
export async function getUniqueArtikulsFromAnalogsUtil(): Promise<string[]> {
  const artikuls = await Analog.distinct("artikul");
  return artikuls.filter((a): a is string => typeof a === "string" && a.trim() !== "");
}
