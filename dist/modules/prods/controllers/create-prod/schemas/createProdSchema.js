import { z } from "zod";
export const createProdSchema = z.object({
    name: z.string().min(1, "Name is required"),
    title: z.string().min(1, "Title is required"),
    imageUrl: z.string().min(1, "ImageUrl is required"),
});
