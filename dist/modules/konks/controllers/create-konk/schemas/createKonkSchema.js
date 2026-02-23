import { z } from "zod";
/** Строка одним словом (без пробелов) */
const oneWord = z
    .string()
    .min(1, "Name is required")
    .regex(/^\S+$/, "Name must be a single word (no spaces)");
export const createKonkSchema = z.object({
    name: oneWord,
    title: z.string().min(1, "Title is required"),
    url: z.string().min(1, "Url is required"),
    imageUrl: z.string().min(1, "ImageUrl is required"),
});
