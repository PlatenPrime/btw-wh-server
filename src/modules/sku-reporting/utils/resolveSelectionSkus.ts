import { Sku } from "../../skus/models/Sku.js";
import { buildSkuListMongoFilter } from "../../skus/utils/buildSkuListMongoFilter.js";
import type { ResolvedSkuRow } from "./resolveKonkProdSkus.js";
import { resolveSkusByIds } from "./resolveSkusByIds.js";

export type ResolveSelectionSkusInput =
  | {
      selectAll: true;
      search?: string;
      konkName?: string;
      prodName?: string;
    }
  | { skuIds: string[] };

/**
 * Resolve SKU для selection Excel/pie.
 * selectAll — той самий filter/sort, що GET /skus (title asc), без page/limit.
 */
export async function resolveSelectionSkus(
  input: ResolveSelectionSkusInput,
): Promise<ResolvedSkuRow[]> {
  if ("skuIds" in input) {
    return resolveSkusByIds(input.skuIds);
  }

  const filter = await buildSkuListMongoFilter({
    search: input.search,
    konkName: input.konkName,
    prodName: input.prodName,
  });
  const docs = await Sku.find(filter)
    .sort({ title: 1 })
    .select("_id")
    .lean<{ _id: { toString(): string } }[]>();
  if (docs.length === 0) return [];
  return resolveSkusByIds(docs.map((d) => d._id.toString()));
}
