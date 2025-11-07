import { z } from "zod";
/**
 * Схема валидации query параметров для получения позиций по ID паллета
 */
export const getPosesByPalletIdQuerySchema = z.object({
    sortBy: z
        .enum(["artikul", "updatedAt"])
        .optional()
        .default("updatedAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
