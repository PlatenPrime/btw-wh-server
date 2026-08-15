import { z } from "zod";
const optionalBooleanQuery = z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true"));
export const getAllGraboSkusQuerySchema = z.object({
    search: z.string().optional(),
    productId: z.string().optional(),
    isOnSite: optionalBooleanQuery,
    isNewProduct: optionalBooleanQuery,
    color: z.string().optional(),
    size: z.string().optional(),
    material: z.string().optional(),
    gas: z.string().optional(),
    language: z.string().optional(),
    tag: z.string().optional(),
    includeFilterOptions: z
        .union([z.literal("true"), z.literal("false")])
        .optional()
        .transform((v) => v === "true"),
    page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .refine((val) => val > 0, "Page must be positive"),
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 10))
        .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100"),
});
