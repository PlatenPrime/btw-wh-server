import { z } from "zod";
// Схема для массового создания/обновления артикулов
export const upsertArtsSchema = z
    .array(z.object({
    artikul: z.string().min(1, "Artikul is required"),
    zone: z.string().min(1, "Zone is required"),
    nameukr: z.string().optional(),
    namerus: z.string().optional(),
    limit: z.number().nonnegative("Limit must be non-negative").optional(),
    marker: z.string().optional(),
}))
    .min(1, "At least one art is required");
