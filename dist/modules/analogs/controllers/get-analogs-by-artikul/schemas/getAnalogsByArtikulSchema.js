import { z } from "zod";
export const getAnalogsByArtikulSchema = z.object({
    artikul: z.string().min(1, "artikul is required"),
});
