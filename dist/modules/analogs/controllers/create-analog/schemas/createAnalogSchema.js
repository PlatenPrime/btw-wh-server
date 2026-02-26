import { z } from "zod";
export const createAnalogSchema = z
    .object({
    konkName: z.string().min(1, "konkName is required"),
    prodName: z.string().min(1, "prodName is required"),
    url: z.string().min(1, "url is required"),
    artikul: z.string().optional().default(""),
    title: z.string().optional(),
    imageUrl: z.string().optional(),
})
    .refine((data) => {
    const hasArtikul = Boolean(data.artikul && data.artikul.trim() !== "");
    if (hasArtikul)
        return true;
    return (Boolean(data.title && data.title.trim() !== "") &&
        Boolean(data.imageUrl && data.imageUrl.trim() !== ""));
}, {
    message: "When artikul is empty, title and imageUrl are required",
    path: ["title"],
});
