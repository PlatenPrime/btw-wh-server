import { z } from "zod";

export const getAirGroupPagesProductsSchema = z.object({
  groupUrl: z.string().min(1, "groupUrl is required").url("Invalid URL"),

  maxPages: z.number().int().min(1).max(200).optional(),
});

export type GetAirGroupPagesProductsInput = z.infer<
  typeof getAirGroupPagesProductsSchema
>;
