import type { GetAllGraboSkusQuery } from "../controllers/get-all-grabo-skus/schemas/getAllGraboSkusQuerySchema.js";
import { escapeGraboSkuRegex } from "./escapeGraboSkuRegex.js";

export type GraboSkuListFilterQuery = Omit<
  GetAllGraboSkusQuery,
  "page" | "limit" | "includeFilterOptions"
>;

function trimmedOrUndefined(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Mongo-фильтр списка GraboSku. Несколько полей — AND.
 * `size` — опция селекта (префикс до `/`), не сырая строка PDP.
 */
export function buildGraboSkuListMongoFilter(
  query: GraboSkuListFilterQuery
): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  const search = trimmedOrUndefined(query.search);
  const productId = trimmedOrUndefined(query.productId);
  const color = trimmedOrUndefined(query.color);
  const size = trimmedOrUndefined(query.size);
  const material = trimmedOrUndefined(query.material);
  const gas = trimmedOrUndefined(query.gas);
  const language = trimmedOrUndefined(query.language);
  const tag = trimmedOrUndefined(query.tag);

  if (search !== undefined) {
    const regex = {
      $regex: escapeGraboSkuRegex(search),
      $options: "i",
    };
    filter.$or = [{ title: regex }, { productId: regex }];
  }
  if (productId !== undefined) filter.productId = productId;
  if (typeof query.isOnSite === "boolean") filter.isOnSite = query.isOnSite;
  if (typeof query.isNewProduct === "boolean") {
    filter.isNewProduct = query.isNewProduct;
  }
  if (color !== undefined) filter.color = color;
  if (size !== undefined) {
    filter.size = {
      $regex: `^${escapeGraboSkuRegex(size)}(\\s*/|$)`,
    };
  }
  if (material !== undefined) filter.material = material;
  if (gas !== undefined) filter.gas = gas;
  if (language !== undefined) filter.language = language;
  if (tag !== undefined) filter.tags = tag;

  return filter;
}
