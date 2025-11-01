import { z } from "zod";
export const getBtradeArtInfoSchema = z.object({
    artikul: z.string().min(1, "Artikul is required"),
});
