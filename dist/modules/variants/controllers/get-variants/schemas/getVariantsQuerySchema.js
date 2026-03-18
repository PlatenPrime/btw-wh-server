import { z } from "zod";
import { variantsPaginationQuerySchema } from "./variantsPaginationQuerySchema.js";
export const getVariantsQuerySchema = z
    .object({
    konkName: z.string().optional(),
    prodName: z.string().optional(),
})
    .merge(variantsPaginationQuerySchema);
