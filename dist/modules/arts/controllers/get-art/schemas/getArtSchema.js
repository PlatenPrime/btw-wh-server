import { z } from "zod";
export const getArtSchema = z.object({
    artikul: z.string().min(1, "Artikul is required"),
});
