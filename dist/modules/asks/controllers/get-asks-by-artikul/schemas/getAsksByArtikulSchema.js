import { z } from "zod";
export const getAsksByArtikulSchema = z.object({
    artikul: z.string().min(1, {
        message: "Artikul is required and must be a non-empty string",
    }),
});
