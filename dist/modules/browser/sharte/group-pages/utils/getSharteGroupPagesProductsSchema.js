import { z } from "zod";
export const getSharteGroupPagesProductsSchema = z.object({
    groupUrl: z.string().min(1, "groupUrl is required").url("Invalid URL"),
    maxPages: z.number().int().min(1).max(200).optional(),
});
