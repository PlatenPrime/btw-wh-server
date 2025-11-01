import { z } from "zod";
// Схема для параметров запроса getAllArts
export const getAllArtsQuerySchema = z.object({
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
    search: z.string().optional().default(""),
});
