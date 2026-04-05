import { z } from "zod";
import { dateStringSchema } from "../../../../sku-slices/controllers/common/schemas/dateSchema.js";
export const getAllSkusQuerySchema = z.object({
    konkName: z.string().optional(),
    prodName: z.string().optional(),
    search: z.string().optional(),
    isInvalid: z
        .union([z.literal("true"), z.literal("false")])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === "true")),
    createdFrom: dateStringSchema.optional(),
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
