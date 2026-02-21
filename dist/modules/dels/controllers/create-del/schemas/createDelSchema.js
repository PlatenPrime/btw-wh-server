import { z } from "zod";
const artikulsSchema = z.record(z.string(), z.number());
export const createDelSchema = z.object({
    title: z.string().min(1, "Title is required"),
    prodName: z.string().min(1, "prodName is required"),
    artikuls: artikulsSchema.optional().default({}),
});
