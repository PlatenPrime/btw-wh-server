import { z } from "zod";
export const createKaskSchema = z.object({
    artikul: z.string().min(1, "Artikul is required"),
    nameukr: z.string().min(1, "Nameukr is required"),
    quant: z.number().optional(),
    zone: z.string().min(1, "Zone is required"),
    com: z.string().optional(),
});
