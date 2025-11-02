import { z } from "zod";

export const getPalletByTitleSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

export type GetPalletByTitleInput = z.infer<typeof getPalletByTitleSchema>;





