import { z } from "zod";
export const GRABO_LISTING_DEFAULT_MAX_PAGES = 100;
export const getGraboListingProductsSchema = z.object({
    groupUrl: z.string().min(1, "groupUrl is required").url("Invalid URL"),
    maxPages: z.number().int().min(1).max(200).optional(),
});
