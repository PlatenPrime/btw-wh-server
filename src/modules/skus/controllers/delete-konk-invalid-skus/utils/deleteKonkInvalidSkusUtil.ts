import { Sku } from "../../../models/Sku.js";

const ALL_KONKS = "all" as const;

export async function deleteKonkInvalidSkusUtil(
  konkName: string,
): Promise<{ deletedCount: number }> {
  const filter =
    konkName === ALL_KONKS
      ? { isInvalid: true as const }
      : { konkName, isInvalid: true as const };

  const res = await Sku.deleteMany(filter);
  return { deletedCount: res.deletedCount };
}
