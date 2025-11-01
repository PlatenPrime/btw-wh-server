import { z } from "zod";
export const updatePosSchema = z.object({
    artikul: z.string().optional(),
    nameukr: z.string().optional(),
    quant: z.number().optional(),
    boxes: z.number().optional(),
    date: z.string().optional(),
    sklad: z.string().optional(),
    comment: z.string().optional(),
});
