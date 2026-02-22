import { z } from "zod";
export const getSharikStockSchema = z.object({
    artikul: z.string().min(1, "Artikul is required"),
});
