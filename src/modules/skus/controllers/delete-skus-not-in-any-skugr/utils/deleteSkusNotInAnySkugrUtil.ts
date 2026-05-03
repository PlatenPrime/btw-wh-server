import { Sku } from "../../../models/Sku.js";
import { buildSkuListMongoFilter } from "../../../utils/buildSkuListMongoFilter.js";
import type { DeleteSkusNotInAnySkugrQuery } from "../schemas/deleteSkusNotInAnySkugrQuerySchema.js";

export const deleteSkusNotInAnySkugrUtil = async (
  query: DeleteSkusNotInAnySkugrQuery,
): Promise<{ deletedCount: number }> => {
  const filter = await buildSkuListMongoFilter({
    ...query,
    notInAnySkugr: true,
  });
  const res = await Sku.deleteMany(filter);
  return { deletedCount: res.deletedCount ?? 0 };
};
