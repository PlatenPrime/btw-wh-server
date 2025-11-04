import { z } from "zod";
/**
 * Схема валидации query параметров для получения позиций по ID паллета
 */
export const getPosesByPalletIdQuerySchema = z.object({
    sortBy: z
        .enum(["artikul", "createdAt"])
        .optional()
        .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
