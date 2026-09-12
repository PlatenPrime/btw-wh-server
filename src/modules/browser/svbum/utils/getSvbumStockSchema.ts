import { z } from "zod";

export const getSvbumStockSchema = z.object({
  link: z.string().min(1, "Link is required").url("Invalid URL"),
});

export type GetSvbumStockInput = z.infer<typeof getSvbumStockSchema>;
