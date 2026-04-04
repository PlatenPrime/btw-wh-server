import { z } from "zod";
import { dateStringSchema } from "../../common/schemas/dateSchema.js";
export const getSkuSliceQuerySchema = z.object({
    konkName: z.string().min(1, "konkName is required"),
    date: dateStringSchema,
    isInvalid: z
        .enum(["true", "false"])
        .optional()
        .transform((val) => (val === undefined ? undefined : val === "true")),
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
