import { z } from "zod";
/** Ключ конкурента або зарезервоване значення `all` — усі конкуренти (як у invalid-excel). */
export const deleteKonkInvalidSkusParamsSchema = z.object({
    konkName: z.union([z.literal("all"), z.string().min(1, "konkName is required")]),
});
