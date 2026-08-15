import { GraboSku } from "../models/GraboSku.js";

/**
 * Снимает isOnSite у карточек, чей url не встретился в листингах этого прогона.
 * Пустой listedUrls не трогает коллекцию (absent-pass вызывает вызывающий код).
 */
export async function markGraboSkusOffSiteUtil(
  listedUrls: string[]
): Promise<number> {
  if (listedUrls.length === 0) {
    return 0;
  }

  const result = await GraboSku.updateMany(
    { url: { $nin: listedUrls } },
    { $set: { isOnSite: false } }
  );

  return result.modifiedCount;
}
