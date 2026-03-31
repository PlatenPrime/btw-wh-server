import { Art } from "../../arts/models/Art.js";

/**
 * Возвращает уникальные непустые артикулы из коллекции arts (поле artikul).
 */
export async function getUniqueArtikulsFromArtsUtil(): Promise<string[]> {
  const artikuls = await Art.distinct("artikul");
  return artikuls.filter(
    (artikul): artikul is string =>
      typeof artikul === "string" && artikul.trim() !== ""
  );
}
