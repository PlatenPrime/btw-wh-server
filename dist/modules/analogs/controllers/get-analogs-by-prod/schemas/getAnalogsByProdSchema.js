import { z } from "zod";
import { analogsPaginationQuerySchema } from "../../get-analogs/schemas/analogsPaginationQuerySchema.js";
export const getAnalogsByProdSchema = z
    .object({
    prodName: z.string().min(1, "prodName is required"),
})
    .merge(analogsPaginationQuerySchema);
