import { z } from "zod";
export const createAnalogSchema = z
    .object({
    konkName: z.string().min(1, "konkName is required"),
    prodName: z.string().min(1, "prodName is required"),
    url: z.string().min(1, "url is required"),
    artikul: z.string().optional().default(""),
})
    .superRefine((data, ctx) => {
    const hasArtikul = Boolean(data.artikul && data.artikul.trim() !== "");
    if (!hasArtikul) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "When artikul is empty, analog must be linked to an existing art",
            path: ["artikul"],
        });
    }
});
