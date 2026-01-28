import { z } from "zod";
export const createPalletGroupSchema = z.object({
    title: z.string().min(1, "Title is required"),
    order: z.number().int().min(1, "Order must be at least 1").optional(),
});
