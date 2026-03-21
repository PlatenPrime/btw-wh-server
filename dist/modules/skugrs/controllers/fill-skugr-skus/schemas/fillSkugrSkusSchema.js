import { z } from "zod";
export const fillSkugrSkusSchema = z.object({
    id: z.string().min(1, "id is required"),
    maxPages: z.coerce.number().int().min(1).max(200).optional(),
});
