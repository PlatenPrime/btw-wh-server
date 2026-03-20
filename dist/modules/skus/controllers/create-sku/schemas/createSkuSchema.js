import { z } from "zod";
export const createSkuSchema = z.object({
    konkName: z.string().min(1, "KonkName is required"),
    prodName: z.string().min(1, "ProdName is required"),
    btradeAnalog: z.string().default(""),
    title: z.string().min(1, "Title is required"),
    url: z.string().url("Url must be a valid URL"),
});
