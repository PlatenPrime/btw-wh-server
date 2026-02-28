import { z } from "zod";
export const getSharteStockSchema = z.object({
    url: z.string().url("Valid product page URL is required"),
});
