import { z } from "zod";
const artikulItemSchema = z.object({
    artikul: z.string().min(1, "Artikul is required"),
    quantity: z.number(),
});
export const createDelSchema = z.object({
    title: z.string().min(1, "Title is required"),
    prodName: z.string().min(1, "prodName is required"),
    artikuls: z
        .array(artikulItemSchema)
        .default([])
        .refine((items) => new Set(items.map((i) => i.artikul)).size === items.length, { message: "Duplicate artikul values are not allowed" }),
});
