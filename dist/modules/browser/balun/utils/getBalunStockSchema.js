import { z } from "zod";
export const getBalunStockSchema = z.object({
    link: z
        .string()
        .min(1, "Link is required")
        .url("Invalid URL"),
});
