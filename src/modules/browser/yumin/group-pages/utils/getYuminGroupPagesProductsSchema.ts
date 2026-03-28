import { z } from "zod";

export const getYuminGroupPagesProductsSchema = z.object({
  /** URL первой страницы списка API, например https://yumi.market/api/products?category_id=... */
  groupUrl: z.string().min(1, "groupUrl is required").url("Invalid URL"),

  maxPages: z.number().int().min(1).max(200).optional(),
});

export type GetYuminGroupPagesProductsInput = z.infer<
  typeof getYuminGroupPagesProductsSchema
>;
