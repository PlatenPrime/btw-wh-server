import { z } from "zod";
export const updateBtradeStockSchema = z.object({
    artikul: z
        .string({
        required_error: "artikul is required",
        invalid_type_error: "artikul must be a string",
    })
        .min(1, "artikul cannot be empty"),
});
