import { Sku } from "../models/Sku.js";

/**
 * Записывает artikul только если в документе поле отсутствует или пустая строка.
 * Непустой trim обязателен; иначе no-op.
 */
export async function maybeSetSkuArtikulIfEmpty(
  skuId: string,
  artikul: string | undefined | null,
): Promise<void> {
  if (artikul == null) {
    return;
  }
  const trimmed = artikul.trim();
  if (!trimmed) {
    return;
  }

  await Sku.updateOne(
    {
      _id: skuId,
      $or: [{ artikul: { $exists: false } }, { artikul: "" }],
    },
    { $set: { artikul: trimmed } },
  ).exec();
}
